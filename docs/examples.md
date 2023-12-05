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

## Download all episodes to their own directory

```bash
npx podcast-dl --episode-template "{{title}}/{{title}}" --url "http://eightfour.libsyn.com/rss"
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

## Convert all episodes to MP3s at 192k bitrate with ffmpeg

```bash
npx podcast-dl --url "http://eightfour.libsyn.com/rss" --exec "ffmpeg -i {{episode_path}} -b:a 192k -f mp3 {{episode_path_base}}/{{episode_filename_base}}-192k.mp3"
```
