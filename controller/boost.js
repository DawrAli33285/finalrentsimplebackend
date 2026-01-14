const Boost = require('../models/boost');
const Listing = require('../models/listing');


exports.createBoost = async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_LIVE);   
    
  try {
    const { listingId, amount, duration, paymentMethodId ,estimatedReach} = req.body;


    if (!listingId || !amount || !duration || !paymentMethodId) {
      return res.status(400).json({
        error: 'Please provide listing, amount, duration, and payment method'
      });
    }

    if (amount < 5) {
      return res.status(400).json({
        error: 'Minimum boost amount is $5'
      });
    }

    
    if (![3, 7, 14, 30].includes(duration)) {
      return res.status(400).json({
        error: 'Invalid duration. Must be 3, 7, 14, or 30 days'
      });
    }

    let id = req?.user?._id ? req?.user?._id : req.user.id;
 
    
    const listing = await Listing.findOne({
      _id: listingId,
      vendor: id
    });

    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found or you do not have permission to boost this listing'
      });
    }

   
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true, 
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        listingId: listingId.toString(),
        vendorId: id.toString(),
        duration: duration.toString(),
        boostAmount: amount.toString(),
        listingTitle: listing.title
      },
      description: `Boost for listing: ${listing.title} (${duration} days)`
    });

  
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment failed. Please try again.',
        paymentStatus: paymentIntent.status
      });
    }

  
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);


    const boost = await Boost.create({
      vendor: id,
      listing: listingId,
      amount,
      duration,
      startDate,
      est_reach:estimatedReach,
      endDate,
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'completed',
      results: {
        initialViews: listing.engagement.views,
        currentViews: listing.engagement.views,
        additionalViews: 0,
        initialLikes: listing.engagement.likes,
        currentLikes: listing.engagement.likes
      }
    });

  
    listing.visibility.isBoosted = true;
    listing.visibility.boostEndDate = endDate;
    listing.visibility.boostAmount = amount;
    listing.visibility.est_react=estimatedReach
    
   
    listing.visibility.visibilityScore = Math.min(100, (listing.visibility.visibilityScore || 50) + 30);
    
    await listing.save();

   
    res.status(201).json({
      success: true,
      message: 'Boost activated successfully! Payment processed.',
      boost,
      payment: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
        currency: paymentIntent.currency
      }
    });

  } catch (error) {
    console.error('Create boost error:', error);
    

    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: error.message || 'Your card was declined. Please try another payment method.'
      });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Invalid payment request. Please check your payment details.'
      });
    }

    if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({
        error: 'Payment authentication failed. Please try again.'
      });
    }

    if (error.type === 'StripeConnectionError') {
      return res.status(503).json({
        error: 'Network error. Please check your connection and try again.'
      });
    }


    res.status(500).json({
      error: 'Failed to create boost. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



exports.getActiveBoosts = async (req, res) => {
    try {
      const boosts = await Boost.find({
        vendor: req.vendor.id,
        status: 'active'
      })
      .populate('listing', 'title')
      .sort({ createdAt: -1 });
  
      res.status(200).json({
        success: true,
        boosts
      });
  
    } catch (error) {
      console.error('Get boosts error:', error);
      res.status(500).json({
        error: 'Failed to fetch boosts'
      });
    }
  };