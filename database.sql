create TABLE person(
                       id SERIAL PRIMARY KEY,
                       name VARCHAR (255),
                       telegram_chat_id INTEGER,
                       monitor_limit INTEGER
);

create TABLE instagram_account(
                     id SERIAL PRIMARY KEY,
                     account_name VARCHAR (255),
                     last_monitored_post VARCHAR(255),
                     person_to_send_id INTEGER,
                     FOREIGN KEY (person_to_send_id) REFERENCES person (id)
);

create TABLE things_to_monitor(
                    id SERIAL PRIMARY KEY,
                    monitor_stories BOOLEAN,
                    monitor_posts BOOLEAN,
                    FOREIGN KEY (id) REFERENCES instagram_account (id)
);