The standard flow
Create order (backend): the client requests payment; the server calls the gateway API to create an order with the amount, currency, and a receipt id. The gateway returns an order_id.
Open checkout (frontend): React receives the order_id and opens the gateway’s checkout window.
Customer pays: the gateway processes the payment directly with the bank.
Result returned (frontend): on success, the gateway gives the client a payment_id and a signature.
Verify (backend): the client sends these to your server. The server recomputes the signature using its secret key and compares. A match proves the payment is genuine.
Record and fulfil: only after verification does the server mark the order as paid and deliver the product or service.
Webhook (backup): the gateway independently notifies your server of the final status, covering cases where the browser closed before step 5.
