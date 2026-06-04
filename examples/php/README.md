# PHP example

Requirements: PHP 8.1+, `ext-curl`, `ext-json`

## Usage

```php
require_once 'I18nClient.php';

$i18n = new I18nClient($_ENV['I18N_API_KEY']);

// All translations for English
$bundle = $i18n->translations('en');
echo I18nClient::t($bundle, 'common.welcome'); // Welcome

// Single namespace
$nav = $i18n->translationGroup('en', 'nav');
echo $nav['home']; // Home

// Single key
echo $i18n->translationKey('en', 'common', 'welcome'); // Welcome
```

## Laravel

Drop `I18nClient.php` into `app/Services/` and bind it in a service provider:

```php
// AppServiceProvider.php
$this->app->singleton(I18nClient::class, fn() =>
    new I18nClient(config('services.i18nme.key'))
);

// config/services.php
'i18nme' => ['key' => env('I18N_API_KEY')],
```

Inject it anywhere:

```php
class HomeController extends Controller
{
    public function __construct(private I18nClient $i18n) {}

    public function index()
    {
        $bundle = $this->i18n->translations(app()->getLocale());
        return view('home', ['t' => $bundle]);
    }
}
```
