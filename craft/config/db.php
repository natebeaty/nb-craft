<?php

/**
 * Database Configuration
 *
 * All of your system's database configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/db.php
 */

// Get environment
require('_env.php');

return array(
    'server'      => '127.0.0.1',
    'user'        => $customEnv['user'],
    'password'    => $customEnv['password'],
    'database'    => $customEnv['database'],
    'tablePrefix' => 'craft',
);
