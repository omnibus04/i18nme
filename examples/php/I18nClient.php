<?php
/**
 * I18nClient.php — i18nme PHP client
 *
 * Requirements: PHP 8.1+, ext-json, ext-curl (or Guzzle — see below)
 *
 * Usage:
 *   $i18n = new I18nClient($_ENV['I18N_API_KEY']);
 *   $bundle = $i18n->translations('en');
 *   echo $bundle['common']['welcome']; // Welcome
 */

declare(strict_types=1);

class I18nClient
{
    private const BASE_URL = 'https://sapi.i18nme.com';

    /** @var array<string, array{data: mixed, ts: float}> */
    private array $cache = [];

    public function __construct(
        private readonly string $apiKey,
        private readonly int $ttl = 300,   // cache TTL in seconds (0 to disable)
        private readonly int $timeout = 10, // HTTP timeout in seconds
    ) {
        if ($this->apiKey === '') {
            throw new \InvalidArgumentException('i18nme: API key must not be empty');
        }
    }

    /**
     * Returns the project manifest (available languages).
     *
     * @return array{languages: list<array{code: string, name: string, iso: string}>}
     */
    public function manifest(): array
    {
        return $this->get('/v1/cached/manifest');
    }

    /**
     * Returns all translations for a language as [namespace => [key => value]].
     *
     * @return array<string, array<string, string>>
     */
    public function translations(string $lang): array
    {
        return $this->get("/v1/cached/translations/{$lang}");
    }

    /**
     * Returns translations for a single namespace.
     *
     * @return array<string, string>
     */
    public function translationGroup(string $lang, string $group): array
    {
        return $this->get("/v1/cached/translations/{$lang}/{$group}");
    }

    /**
     * Returns the value of a single translation key.
     */
    public function translationKey(string $lang, string $group, string $key): string
    {
        $data = $this->get("/v1/cached/translations/{$lang}/{$group}/{$key}");
        return (string) ($data['value'] ?? '');
    }

    /**
     * Convenience helper: look up a dot-notated key in a bundle.
     * Returns $dotKey itself if not found.
     *
     * @param array<string, array<string, string>> $bundle
     */
    public static function t(array $bundle, string $dotKey): string
    {
        [$group, $key] = explode('.', $dotKey, 2) + [1 => ''];
        return $bundle[$group][$key] ?? $dotKey;
    }

    public function clearCache(): void
    {
        $this->cache = [];
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private function get(string $path): mixed
    {
        if ($this->ttl > 0 && isset($this->cache[$path])) {
            ['data' => $data, 'ts' => $ts] = $this->cache[$path];
            if (microtime(true) - $ts < $this->ttl) {
                return $data;
            }
        }

        $ch = curl_init(self::BASE_URL . $path);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_HTTPHEADER     => ["X-API-Key: {$this->apiKey}"],
        ]);

        $body   = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error  = curl_error($ch);
        curl_close($ch);

        if ($error !== '') {
            throw new \RuntimeException("i18nme: cURL error: {$error}");
        }
        if ($status === 429) {
            throw new \RuntimeException('i18nme: rate limited');
        }
        if ($status !== 200) {
            throw new \RuntimeException("i18nme: API error {$status}: {$body}");
        }

        $data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);

        if ($this->ttl > 0) {
            $this->cache[$path] = ['data' => $data, 'ts' => microtime(true)];
        }

        return $data;
    }
}
