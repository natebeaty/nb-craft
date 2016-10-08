<?php

/**
 * General Configuration
 *
 * All of your system's general configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/general.php
 */

// Get environment
require('_env.php');

return array(

    // Universal settings
    '*' => array(
        'omitScriptNameInUrls' => true,
        'enableCsrfProtection' => true,
        'siteUrl' => $customEnv['baseUrl'],
        'environmentVariables' => array(
            'baseUrl'  => $customEnv['baseUrl'],
            'basePath' => $customEnv['basePath'],
        )
    ),

    // Custom environment settings
    parse_url($customEnv['baseUrl'], PHP_URL_HOST) => $customEnv['general']

);