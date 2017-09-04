<?php
require_once("../shared/connect.php");

$revision = '1.1';

$migrator = new Migrator($db, $revision);
if(isset($argv[1]) && $argv[1] == 'start') {
    $migrator->init(isset($argv[2]) ? $argv[2] : null);
} else {
    $migrator->migrate();
}




class Migrator {

    protected $output;
    protected $logger;
    protected $files;
    protected $sql_executer;

    public function __construct($db, $revision) {
        $this->output = new ConsoleOutput();
        $this->logger = new Logger($db);
        $this->files = new Files($revision);
        $this->sql_executer = new SqlExecuter($db, $this->output);
    }


    public function migrate() {
        $filesystem_files = $this->files->scan();
        $logged_files = $this->logger->files();
        $files = array_diff($filesystem_files, $logged_files);
        if(count($files) == 0) {
            $this->output->info('Everything is up to date.');
            return;
        }
        foreach($files as $file) {
            $this->output->info('Executing '.$file);
            $sql = $this->files->readFile($file);
            if($this->sql_executer->execute($sql)) {
                $this->logger->append($file);
            } else return;
        }
        $this->output->info('All done.');
    }


    public function init($rev) {
        if(!$this->files->revExists($rev)) {
            $this->output->error('Revision '.$rev.' does not exists');
            exit;
        }
        $this->logger->truncate();
        $files = $this->files->scan();
        foreach($files as $file) {
            list($file_rev, $tmp) = explode('/', $file);
            if(!$rev || $file_rev !== $rev) {
                $this->logger->append($file);
            } else break;
        }
        if($rev) {
            $this->output->info('All done, you can migrate from '.$rev.' now.');
        } else {
            $this->output->info('All done, all migrations logged.');
        }
    }

}




class ConsoleOutput {

    public function info($str) {
        echo $str."\n";
    }

    public function error($str) {
        echo chr(27)."[41m".$str.chr(27)."[0m\n";
    }

}




class Logger {

    protected $db;
    protected $table = 'schema_revision';

    public function __construct($db) {
        $this->db = $db;
    }


    public function append($file) {
        $query = 'insert into '.$this->table.' (file) values (:file)';
        $stmt = $this->db->prepare($query);
        $stmt->execute(['file' => $file]);
    }


    public function truncate() {
        $this->db->exec('truncate table '.$this->table);
    }


    public function files() {
        $query = 'SELECT * FROM '.$this->table;
        $stmt = $this->db->query($query);
        $rows = $stmt->fetchAll();
        $res = [];
        foreach($rows as $row) {
            $res[] = $row['file'];
        }
        return $res;
    }

}




class Files {

    protected $path;

    public function __construct($revision) {
        $this->path = __DIR__.'/'.$revision.'/';
    }

    public function scan() {
        $res = [];
        $folders = array_diff(scandir($this->path), ['..', '.']);
        foreach($folders as $folder) {
            $subfolder = $this->path.'/'.$folder;
            if(!is_dir($subfolder)) continue;
            $files = array_diff(scandir($subfolder), ['..', '.']);
            foreach($files as $file) {
                if(strtolower(pathinfo($file, PATHINFO_EXTENSION)) == 'sql') {
                    $res[] = $folder.'/'.$file;
                }
            }
        }
        return $res;
    }


    public function readFile($file) {
        return file_get_contents($this->path.$file);
    }


    public function revExists($rev) {
        return is_dir($this->path.$rev);
    }

}



class SqlExecuter {

    protected $output;
    protected $db;


    public function __construct($db, $output) {
        $this->db = $db;
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->output = $output;
    }


    public function execute($sql) {
        $queries = $this->splitQueries($sql);
        foreach($queries as $query) {
            if(!$this->query($query)) {
                return false;
            }
        }
        return true;
    }


    private function splitQueries($sql) {
        $data = preg_split('~\([^)]*\)(*SKIP)(*F)|;~', $sql);
        $res = [];
        foreach($data as $q) {
            $q = trim($q);
            if(!empty($q)) {
                $res[] = $q;
            }
        }
        return $res;
    }


    private function query($query) {
        try {
            $this->db->exec($query);
        } catch(PDOException $e){
            $this->output->error($query);
            $this->output->error($e->getMessage());
            return false;
        }
        return true;
    }

}