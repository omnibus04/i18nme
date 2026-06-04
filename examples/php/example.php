<?php
/**
 * example.php — i18nme PHP usage examples
 *
 * Usage:
 *   export I18N_API_KEY="key_live_XXXX"
 *   php example.php
 */

declare(strict_types=1);

require_once __DIR__ . '/I18nClient.php';

$apiKey = getenv('I18N_API_KEY') ?: throw new \RuntimeException('Set I18N_API_KEY');

$i18n = new I18nClient($apiKey);

// Manifest
$manifest = $i18n->manifest();
$codes = array_column($manifest['languages'], 'code');
echo 'Languages: ' . implode(', ', $codes) . PHP_EOL;
// Languages: en, de, pl

// All translations for English
$bundle = $i18n->translations('en');
echo 'welcome: ' . I18nClient::t($bundle, 'common.welcome') . PHP_EOL;
// welcome: Welcome

// Single namespace
$common = $i18n->translationGroup('en', 'common');
print_r($common);
// Array ( [welcome] => Welcome [logout] => Log out )

// Single key
$value = $i18n->translationKey('en', 'common', 'welcome');
echo 'key: ' . $value . PHP_EOL;
// key: Welcome
