# Examples

## Download all podcast episodes

```bash
npx podcast-dl --url "http://eightfour.libsyn.com/rss"
```

## Download all podcast episodes (4 episodes at a time)

```bash
npx podcast-dl --threads 4 --url "http://eightfour.libsyn.com/rss"
```

## Download all episodes to a different directory

```bash
npx podcast-dl --out-dir "./another/directory" --url "http://eightfour.libsyn.com/rss"
```

## Download the last 10 episodes

```bash
npx podcast-dl --limit 10 --url "http://eightfour.libsyn.com/rss"
```

## Download the first 10 episodes

```bash
npx podcast-dl --limit 10 --reverse --url "http://eightfour.libsyn.com/rss"
```

## Download all episodes released in 2021

```bash
npx podcast-dl --after "01/01/2021" --before "12/31/2021" --url "http://eightfour.libsyn.com/rss"
```

## Download all episodes with "Zelda" in the title

```bash
npx podcast-dl --episode-regex "Zelda" --url "http://eightfour.libsyn.com/rss"
```

### Download all episodes + standard set of metadata for the podcast

```bash
npx podcast-dl --include-meta  --url "http://eightfour.libsyn.com/rss"
```

### Download all episodes + standard set of metadata for the episodes

```bash
npx podcast-dl --include-episode-meta  --url "http://eightfour.libsyn.com/rss"
```

### Download all episodes + all top-level metadata for the episodes (excluding nested fields like `itunes:subtitle`)

```bash
npx podcast-dl --include-episode-meta '*' --url "http://eightfour.libsyn.com/rss"
```

### Download all episodes + all metadata for the episodes (including nested fields like `itunes:subtitle`)

```bash
npx podcast-dl --include-episode-meta '**' --url "http://eightfour.libsyn.com/rss"
```

### Download all episodes + all metadata for the episodes, except for itunes metadata

```bash
npx podcast-dl --include-episode-meta '**' --include-episode-meta '!itunes.**' --url "http://eightfour.libsyn.com/rss"
```
