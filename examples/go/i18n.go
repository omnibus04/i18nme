// i18n.go — i18nme Go client
//
// Usage:
//   client := i18n.NewClient(os.Getenv("I18N_API_KEY"))
//   bundle, err := client.Translations(ctx, "en")
//   fmt.Println(bundle["common"]["welcome"])
//
// No external dependencies — uses only the standard library.

package i18n

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

const baseURL = "https://sapi.i18nme.com"

// TranslationBundle is a map[namespace]map[key]value.
type TranslationBundle map[string]map[string]string

// Language describes a single language in the project manifest.
type Language struct {
	Code string `json:"code"`
	Name string `json:"name"`
	ISO  string `json:"iso"`
}

// Manifest is the project manifest response.
type Manifest struct {
	Languages []Language `json:"languages"`
}

type cacheEntry struct {
	data any
	ts   time.Time
}

// Client is a thread-safe i18nme API client.
type Client struct {
	apiKey  string
	ttl     time.Duration
	http    *http.Client
	mu      sync.RWMutex
	cache   map[string]cacheEntry
}

// NewClient creates a new Client with a 5-minute cache TTL.
// Pass 0 as ttl to disable caching.
func NewClient(apiKey string, opts ...Option) *Client {
	c := &Client{
		apiKey: apiKey,
		ttl:    5 * time.Minute,
		http:   &http.Client{Timeout: 10 * time.Second},
		cache:  make(map[string]cacheEntry),
	}
	for _, o := range opts {
		o(c)
	}
	return c
}

// Option configures the Client.
type Option func(*Client)

// WithTTL sets the cache TTL. Use 0 to disable caching.
func WithTTL(d time.Duration) Option { return func(c *Client) { c.ttl = d } }

// WithHTTPClient replaces the default http.Client.
func WithHTTPClient(h *http.Client) Option { return func(c *Client) { c.http = h } }

func (c *Client) get(ctx context.Context, path string, out any) error {
	if c.ttl > 0 {
		c.mu.RLock()
		entry, ok := c.cache[path]
		c.mu.RUnlock()
		if ok && time.Since(entry.ts) < c.ttl {
			// Re-marshal to out (simple deep copy via JSON)
			b, _ := json.Marshal(entry.data)
			return json.Unmarshal(b, out)
		}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+path, nil)
	if err != nil {
		return err
	}
	req.Header.Set("X-API-Key", c.apiKey)

	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusTooManyRequests {
		return fmt.Errorf("i18nme: rate limited (retry after %s)", res.Header.Get("Retry-After"))
	}
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("i18nme: unexpected status %d", res.StatusCode)
	}

	if err := json.NewDecoder(res.Body).Decode(out); err != nil {
		return err
	}

	if c.ttl > 0 {
		c.mu.Lock()
		c.cache[path] = cacheEntry{data: out, ts: time.Now()}
		c.mu.Unlock()
	}
	return nil
}

// Manifest returns the project manifest (available languages).
func (c *Client) Manifest(ctx context.Context) (*Manifest, error) {
	var m Manifest
	return &m, c.get(ctx, "/v1/cached/manifest", &m)
}

// Translations returns all translations for a language.
func (c *Client) Translations(ctx context.Context, lang string) (TranslationBundle, error) {
	var b TranslationBundle
	return b, c.get(ctx, "/v1/cached/translations/"+lang, &b)
}

// TranslationGroup returns translations for a single namespace.
func (c *Client) TranslationGroup(ctx context.Context, lang, group string) (map[string]string, error) {
	var g map[string]string
	return g, c.get(ctx, fmt.Sprintf("/v1/cached/translations/%s/%s", lang, group), &g)
}

// T is a convenience helper — returns bundle["namespace"]["key"] or dotKey if missing.
func T(bundle TranslationBundle, dotKey string) string {
	for i := 0; i < len(dotKey); i++ {
		if dotKey[i] == '.' {
			group, key := dotKey[:i], dotKey[i+1:]
			if ns, ok := bundle[group]; ok {
				if v, ok := ns[key]; ok {
					return v
				}
			}
			return dotKey
		}
	}
	return dotKey
}
