<?php

// Path to your craft/ folder
$craftPath = '../craft';

// Do not edit below this line
$path = rtrim($craftPath, '/').'/app/index.php';

if (!is_file($path))
{
	if (function_exists('http_response_code'))
	{
		http_response_code(503);
	}

	exit('Could not find your craft/ folder. Please ensure that <strong><code>$craftPath</code></strong> is set correctly in '.__FILE__);
}

/*HTMLCache Begin*/if (defined('CRAFT_PLUGINS_PATH')) {require_once CRAFT_PLUGINS_PATH . DIRECTORY_SEPARATOR . 'htmlcache' . DIRECTORY_SEPARATOR . 'functions' . DIRECTORY_SEPARATOR . 'htmlcache.php';} else {require_once str_replace('index.php', '../plugins' . DIRECTORY_SEPARATOR . 'htmlcache' . DIRECTORY_SEPARATOR . 'functions' . DIRECTORY_SEPARATOR . 'htmlcache.php', $path);}htmlcache_checkCache();/*HTMLCache End*/require_once $path;
