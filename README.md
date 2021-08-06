# f

##  a self hosted link shortner running on NodeJS and sqlite3

### DB structure

##### SQL CMDs:
```sql
CREATE DATABASE f;
CREATE TABLE links (id INTEGER PRIMARY KEY NOT NULL AUTOINCREMENT, token TEXT NOT NULL, url TEXT NOT NULL, created TEXT);


```
##### Tables:

| Name | Type | Special |
| :------------- | :------------- | :------------- |
| Item One       | Item Two       | Item Three       |
