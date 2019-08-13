psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL
    CREATE DATABASE "buildnumber-dev";
    GRANT ALL PRIVILEGES ON DATABASE "buildnumber-dev" TO postgres;
    
    CREATE DATABASE "buildnumber-test";
    GRANT ALL PRIVILEGES ON DATABASE "buildnumber-test" TO postgres;
EOSQL