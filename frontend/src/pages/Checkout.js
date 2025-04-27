import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Button,
    Grid,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    CircularProgress,
    Alert,
    Box,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    InputAdornment,
    TextField
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    Delete as DeleteIcon,
    LocationOn as LocationIcon,
    Payment as PaymentIcon,
    LocalShipping as ShippingIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { orderApi } from '../utils/axios';
import { useCart } from '../context/CartContext';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);


// Card Element styling
const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
    },
};

// CheckoutForm component for handling card payments
const CheckoutForm = ({ order, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // 1. Confirm the card payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                order.paymentIntent.clientSecret,
                {
                    payment_method: {
                        card: elements.getElement(CardElement),
                    },
                }
            );

            if (error) {
                setError(error.message);
                onError(error);
            } else {
                // 2. If payment is successful, update the order status
                try {
                    const updateResponse = await axios.post(
                        `http://localhost:3003/api/orders/${order._id}/update-payment`,
                        {
                            paymentIntentId: paymentIntent.id,
                            paymentStatus: 'paid'
                        },
                        {
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    console.log('Payment successful and order updated:', updateResponse.data);
                    onSuccess(paymentIntent);
                } catch (updateError) {
                    console.error('Error updating order status:', updateError);
                    setError('Payment successful but failed to update order status');
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            onError(err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
                <CardElement options={cardElementOptions} />
            </Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={!stripe || processing}
            >
                {processing ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    `Pay Rs. ${order.totalAmount}`
                )}
            </Button>
        </form>
    );
};

// Main Checkout component
const Checkout = () => {
    const navigate = useNavigate();
    const { cart, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        address: '',
        paymentMethod: 'cash',
        deliveryInstructions: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const orderData = {
                items: cart.map(item => ({
                    itemId: item._id,
                    quantity: item.quantity,
                    price: item.price,
                })),
                totalAmount: calculateTotal(),
                address: formData.address,
                paymentMethod: formData.paymentMethod,
                deliveryInstructions: formData.deliveryInstructions,
            };

            await orderApi.post('/orders', orderData);
            clearCart();
            navigate('/orders', { state: { message: 'Order placed successfully!' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(18, 18, 18, 0.95)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                <Container maxWidth="sm">
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            background: 'rgba(30, 30, 30, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: 3,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <Typography
                            variant="h5"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                mb: 2,
                            }}
                        >
                            Your cart is empty
                        </Typography>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/restaurants')}
                            sx={{
                                color: '#E65100',
                                '&:hover': {
                                    background: 'rgba(230, 81, 0, 0.1)',
                                },
                            }}
                        >
                            Back to Restaurants
                        </Button>
                    </Paper>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 4,
                background: 'rgba(18, 18, 18, 0.95)',
                backdropFilter: 'blur(20px)',
            }}
        >
            <Container maxWidth="lg">
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            color: '#E65100',
                            letterSpacing: '1px',
                            position: 'relative',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: -10,
                                left: 0,
                                width: '60px',
                                height: '4px',
                                background: '#E65100',
                                borderRadius: '2px',
                                boxShadow: '0 2px 4px rgba(230, 81, 0, 0.3)',
                            },
                        }}
                    >
                        Checkout
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            mt: 2,
                            color: 'rgba(255, 255, 255, 0.7)',
                        }}
                    >
                        Complete your order details
                    </Typography>
                </Box>

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: `0 4px 12px rgba(244, 67, 54, 0.4)`,
                            background: 'rgba(30, 30, 30, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid rgba(255, 255, 255, 0.1)`,
                            '& .MuiAlert-icon': {
                                color: '#f44336',
                            },
                            '& .MuiAlert-message': {
                                color: 'rgba(255, 255, 255, 0.95)',
                                fontWeight: 500,
                            },
                        }}
                    >
                        {error}
                    </Alert>
                )}

                <Grid container spacing={4}>
                    <Grid item xs={12} md={8}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                background: 'rgba(30, 30, 30, 0.95)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: 3,
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    mb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <LocationIcon sx={{ color: '#E65100' }} />
                                Delivery Details
                            </Typography>

                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="Delivery Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                    margin="normal"
                                    multiline
                                    rows={3}
                                    InputProps={{
                                        startAdornment: <LocationIcon sx={{ color: '#E65100', mr: 1 }} />,
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#E65100',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            '&.Mui-focused': {
                                                color: '#E65100',
                                            },
                                        },
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Delivery Instructions"
                                    name="deliveryInstructions"
                                    value={formData.deliveryInstructions}
                                    onChange={handleChange}
                                    margin="normal"
                                    multiline
                                    rows={2}
                                    InputProps={{
                                        startAdornment: <ShippingIcon sx={{ color: '#E65100', mr: 1 }} />,
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#E65100',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            '&.Mui-focused': {
                                                color: '#E65100',
                                            },
                                        },
                                    }}
                                />

                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        mt: 3,
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <PaymentIcon sx={{ color: '#E65100' }} />
                                    Payment Method
                                </Typography>

                                <TextField
                                    fullWidth
                                    select
                                    label="Payment Method"
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    required
                                    margin="normal"
                                    SelectProps={{
                                        native: true,
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#E65100',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            '&.Mui-focused': {
                                                color: '#E65100',
                                            },
                                        },
                                    }}
                                >
                                    <option value="cash">Cash on Delivery</option>
                                    <option value="card">Credit/Debit Card</option>
                                </TextField>
                            </form>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                background: 'rgba(30, 30, 30, 0.95)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: 3,
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    mb: 3,
                                }}
                            >
                                Order Summary
                            </Typography>

                            <List>
                                {cart.map((item) => (
                                    <ListItem
                                        key={item._id}
                                        sx={{
                                            py: 1,
                                            '&:hover': {
                                                background: 'rgba(255, 255, 255, 0.05)',
                                            },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={item.image}
                                                alt={item.name}
                                                sx={{
                                                    width: 56,
                                                    height: 56,
                                                    mr: 2,
                                                    border: '2px solid #E65100',
                                                }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.9)',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {item.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                    }}
                                                >
                                                    {item.quantity} x Rs. {item.price}
                                                </Typography>
                                            }
                                        />
                                        <Typography
                                            sx={{
                                                color: '#E65100',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Rs. {item.price * item.quantity}
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>

                            <Divider
                                sx={{
                                    my: 2,
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    }}
                                >
                                    Subtotal
                                </Typography>
                                <Typography
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontWeight: 500,
                                    }}
                                >
                                    Rs. {calculateTotal()}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    }}
                                >
                                    Delivery Fee
                                </Typography>
                                <Typography
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontWeight: 500,
                                    }}
                                >
                                    Rs. 50
                                </Typography>
                            </Box>

                            <Divider
                                sx={{
                                    my: 2,
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontWeight: 600,
                                        fontSize: '1.1rem',
                                    }}
                                >
                                    Total
                                </Typography>
                                <Typography
                                    sx={{
                                        color: '#E65100',
                                        fontWeight: 600,
                                        fontSize: '1.1rem',
                                    }}
                                >
                                    Rs. {calculateTotal() + 50}
                                </Typography>
                            </Box>

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                onClick={handleSubmit}
                                sx={{
                                    py: 1.5,
                                    background: 'rgba(230, 81, 0, 0.1)',
                                    color: '#E65100',
                                    border: '1px solid rgba(230, 81, 0, 0.3)',
                                    '&:hover': {
                                        background: 'rgba(230, 81, 0, 0.2)',
                                        borderColor: '#E65100',
                                    },
                                    '&.Mui-disabled': {
                                        background: 'rgba(230, 81, 0, 0.05)',
                                        color: 'rgba(230, 81, 0, 0.3)',
                                    },
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} sx={{ color: '#E65100' }} />
                                ) : (
                                    'Place Order'
                                )}
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Checkout; 