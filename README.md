![f logo](https://github.com/MoPaMo/f/blob/12bacf3ee55fc1e734acd4545aac92975022a81b/static/img/brand/banner.png?raw=true)


f works just with sqlite3 and nodeJS - simple but genius! It's so small you can also use it on micro hosting services like [Glitch](https://glitch.com/edit/#!/import/git?url=https://github.com/MoPaMo/f.git) or [ReplIt](https://replit.com/github/MoPaMo/f)
### DB structure

##### SQL CMDs:
```sql
CREATE DATABASE f;

CREATE TABLE links (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL , token TEXT NOT NULL UNIQUE, url TEXT NOT NULL, created INTEGER);

CREATE TABLE refs (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, link_id INTEGER NOT NULL, lang TEXT, browser_name TEXT, os_name TEXT, versionName TEXT, platType TEXT, referrer TEXT, full_ua TEXT, timeHit INTEGER);

```
##### Tables:

| Name | Type | Special |
| :------------- | :------------- | :------------- |
| Item One       | Item Two       | Item Three       |
