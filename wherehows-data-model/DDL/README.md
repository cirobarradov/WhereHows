It is pretty easy to create all metadata tables in mysql client.
```
cd WhereHows/wherehows-data-model/DDL
docker exec -it datalab-mariadb bash
root@vm-kafka:/var/lib/mysql# mysql -hlocalhost -uwherehows -pwherehows -Dwherehows < create_all_tables_wrapper.sql
```

It is also fine to load each DDL files into a GUI client such as [DBeaver][DBV] or [Aqua Data Studio][ADS]

[DBV]: http://dbeaver.jkiss.org/
[ADS]: http://www.aquafold.com/
