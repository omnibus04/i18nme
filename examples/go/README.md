# Go example

No external dependencies — uses only the Go standard library.

## Usage

```go
import "github.com/omnibus04/i18nme/examples/go"

client := i18n.NewClient(os.Getenv("I18N_API_KEY"))

bundle, err := client.Translations(context.Background(), "en")
if err != nil {
    log.Fatal(err)
}
fmt.Println(i18n.T(bundle, "common.welcome"))
// → Welcome
```

## Options

```go
client := i18n.NewClient(
    os.Getenv("I18N_API_KEY"),
    i18n.WithTTL(10 * time.Minute), // cache TTL (default 5m, 0 to disable)
    i18n.WithHTTPClient(myHTTPClient),
)
```

## Thread safety

`Client` is safe for concurrent use. The in-memory cache uses a `sync.RWMutex`.
