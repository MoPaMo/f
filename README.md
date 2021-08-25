![f logo](https://github.com/MoPaMo/f/blob/12bacf3ee55fc1e734acd4545aac92975022a81b/static/img/brand/banner.png?raw=true)

⚡️ Powerful **Analytics**

🎛 **User-friendly** modern browser interface

💾 > 20 MB 

🌐 Works even on **microhosting services**!

🏗 Build with sqlite3 and nodeJS

🏃 Developed with **speed** in mind 

<!---

f works just with sqlite3 and nodeJS - simple but genius! It's so small you can also use it on micro hosting services like [Glitch](glitch.com) or [ReplIt](https://replit.com/github/MoPaMo/f)--->

## Installing
### Default installing

1. Clone the git repo:
```cmd 
git clone https://github.com/MoPaMo/f.git
```
2. Enter the new directory:
 ```cmd
 cd f
 ```
3. Install the node modules:

```cmd
npm install
4. Add a .env and choose a password
```
echo "pwd=[your password]" > .env

5. Run it!
 ```cmd
 npm start # or node index.js
 ```

## Details
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
