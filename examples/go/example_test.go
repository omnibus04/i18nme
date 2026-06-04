// example_test.go — usage examples for the i18n Go client

package i18n_test

import (
	"context"
	"fmt"
	"os"
	"testing"
)

func ExampleClient() {
	client := NewClient(os.Getenv("I18N_API_KEY"))
	ctx := context.Background()

	// Fetch the manifest
	manifest, err := client.Manifest(ctx)
	if err != nil {
		panic(err)
	}
	for _, lang := range manifest.Languages {
		fmt.Println(lang.Code, lang.Name)
	}
	// Output: en English

	// Fetch all English translations
	bundle, err := client.Translations(ctx, "en")
	if err != nil {
		panic(err)
	}
	fmt.Println(T(bundle, "common.welcome"))
	// Output: Welcome
}

func TestT(_ *testing.T) {
	bundle := TranslationBundle{
		"common": {"welcome": "Welcome", "logout": "Log out"},
	}
	fmt.Println(T(bundle, "common.welcome")) // Welcome
	fmt.Println(T(bundle, "common.missing")) // common.missing (fallback)
}
