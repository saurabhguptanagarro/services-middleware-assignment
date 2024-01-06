1. open root directory in cmd and run "npm install".
2. Run "run.bat" will start all the servers.
    a. Notification Service 1
    b. Notification Service 2
    c. Order Service
    d. Product Service
3. Open postman and send below cURL to Place order.
    ```bash
        curl --location 'http://localhost:3000/placeOrder' \
        --header 'Content-Type: application/json' \
        --data '{
            "items": [
                {
                    "productId": 2,
                    "quantity": 20
                },
                {
                    "productId": 3,
                    "quantity": 21
                }
            ]
        }'
    ```
4. Check cmd for Notification Service 1 and 2, both recieved notification.
5. Open postman and send below cURL to Place order
    ```bash
        curl --location --request PATCH 'http://localhost:3000/updateOrder' \
        --header 'Content-Type: application/json' \
        --data '{
            "orderId": "<order_id>",
            "items": [
                {
                    "productId": 5,
                    "quantity": 2
                },
                {
                    "productId": 5,
                    "quantity": 1
                }
            ]
        }'
    ```
4. Check cmd for Notification Service 1 and 2, ony Notification service 2 recieved notification.