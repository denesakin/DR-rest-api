# REST-api
This api recieves HTTP requests from the frontend client and labels them according to subject (clinic, bookings etc) before publishing them to the MQTT broker. Any request involving simply accessing a database entry instead of changing or adding a new one will bypass the broker and ask the database directly.
