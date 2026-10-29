import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import loadRazorpay from '../utils/loadRazorpay';

const rupees = (paise) => (paise / 100).toFixed(2);

export default function Payments() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPayments = async () => {
    const res = await api.get('/payment/my');
    setPayments(res.data.payments);
  };

  useEffect(() => {
    api
      .get('/payment/products')
      .then((res) => setProducts(res.data.products))
      .catch(() => setError('Failed to load plans'));

    loadPayments().catch(() => setError('Failed to load payment history'));
  }, []);

  const handlePay = async (product) => {
    setError('');
    setMessage('');
    setBusyId(product.id);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        setError('Could not load the payment window. Check your connection.');
        setBusyId(null);
        return;
      }

      // 1. Ask the server to create an order
      const res = await api.post('/payment/create-order', {
        productId: product.id,
      });
      const { orderId, amount, currency, keyId, productName } = res.data;

      // 2. Open the Razorpay checkout window
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Auth Demo',
        description: productName,
        order_id: orderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#3399cc' },

        // 3. On success, send the proof to the server for verification
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setMessage(`Payment successful for ${productName}`);
            await loadPayments();
          } catch (err) {
            setError(
              err.response?.data?.message || 'Payment verification failed'
            );
          } finally {
            setBusyId(null);
          }
        },

        modal: {
          ondismiss: () => setBusyId(null),
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (failure) => {
        setError(failure.error?.description || 'Payment failed');
        setBusyId(null);
        loadPayments();
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start payment');
      setBusyId(null);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '40px auto' }}>
      <h2>Plans and Payments</h2>
      <Link to="/dashboard">Back to dashboard</Link>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Choose a plan</h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {products.map((p) => (
          <div
            key={p.id}
            style={{ border: '1px solid #ccc', padding: 16, width: 200 }}
          >
            <h4>{p.name}</h4>
            <p>₹{p.price}</p>
            <button disabled={busyId !== null} onClick={() => handlePay(p)}>
              {busyId === p.id ? 'Processing...' : 'Pay now'}
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 32 }}>Payment history</h3>
      {payments.length === 0 ? (
        <p>No payments yet.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment ID</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
                <td>{p.productName}</td>
                <td>₹{rupees(p.amount)}</td>
                <td>{p.status}</td>
                <td>{p.razorpayPaymentId || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}