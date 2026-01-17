  // const orderModel = require('../models/order');
  // const userModel = require('../models/user');
  // const Vendor=require('../models/vendor')
  // const jwt = require('jsonwebtoken');
  // const nodemailer=require('nodemailer')

  // const transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: {
  //     user: 'rentsimple159@gmail.com', 
  //     pass: 'upqbbmeobtztqxyg' 
  //   }
  // });


  // module.exports.storeBilling = async (req, res) => {
  //     const { cardState, draftDay } = req.body;
      
  //     try {
        
  //         const paymentMethodToken = jwt.sign(
  //             { paymentMethodId: cardState, draftDay }, 
  //             process.env.PAYMENT_METHOD_JWT_KEY
  //         );

        
  //         await userModel.findByIdAndUpdate(
  //             req.user._id, 
  //             { $set: { paymentMethodToken } },
  //             { lean: true }
  //         );

  //         return res.status(200).json({
  //             message: "Billing details saved successfully"
  //         });
  //     } catch (e) {
  //         console.error("Error storing billing:", e.message);
  //         return res.status(500).json({
  //             error: "Facing issue while storing billing info please try again"
  //         });
  //     }
  // };



  // module.exports.updatePaymentMethod=async(req,res)=>{
  //     const stripe = require('stripe')(process.env.STRIPE_LIVE);
  //     let user=await userModel.findOne({_id:req.user._id})
  //     const {paymentMethodId}=req.body;
      
  //     try{
  //         let paymentMethodData= jwt.verify(user?.paymentMethodToken, process.env.PAYMENT_METHOD_JWT_KEY, {
              
  //         });

      
  //         let paymentMethodToken = jwt.sign({paymentMethodId:paymentMethodId,draftDay:paymentMethodData.draftDay}, process.env.PAYMENT_METHOD_JWT_KEY, {
              
  //         });

  // await userModel.findByIdAndUpdate(req.user._id,{
  //     $set:{
  //         paymentMethodToken
  //     }
  // })

  // await stripe.paymentMethods.attach(paymentMethodId, {
  //     customer: user.customerId,
  // });
        
  // return res.status(200).json({
  //     message:"Billing info updated sucessfully"
  // })
  //     }catch(e){
  //         console.log(e.message);
  //         return res.status(500).json({
  //             error: "Facing issue while upading billing info please try again",
  //             details: e.message
  //         });
  //     }
  // }

  // module.exports.pauseBilling = async (req, res) => {
  //     try {
  //         const stripe = require('stripe')(process.env.STRIPE_LIVE);
        
  //         let orders = await orderModel.find({
              
  //             status: { $in: ['active', 'pending'] }
  //         });
  //         orders=orders?.filter(u=>u?.user?.toString()==req?.user?._id?.toString())


  //         if (orders.length === 0) {
  //             return res.status(400).json({
  //                 error: "No active subscriptions found to pause"
  //             });
  //         }

        
  //         const pausePromises = orders.map(async (order) => {
  //             try {
                
  //                 if (!order.subscriptionId) {
  //                     console.log(`Order ${order._id} has no subscription ID`);
  //                     return { orderId: order._id, success: false, error: 'No subscription ID' };
  //                 }

  //                 const subscription = await stripe.subscriptions.update(
  //                     order.subscriptionId,
  //                     {
  //                         pause_collection: {
  //                             behavior: 'void', 
  //                         },
  //                     }
  //                 );

              
  //                 await orderModel.findByIdAndUpdate(order._id, {
  //                     status: 'paused',
  //                     pausedAt: new Date()
  //                 });

  //                 return { 
  //                     orderId: order._id, 
  //                     subscriptionId: order.subscriptionId,
  //                     success: true, 
  //                     subscription: subscription 
  //                 };

  //             } catch (error) {
  //                 console.log(`Error pausing subscription ${order.subscriptionId}:`, error.message);
  //                 return { 
  //                     orderId: order._id, 
  //                     subscriptionId: order.subscriptionId,
  //                     success: false, 
  //                     error: error.message 
  //                 };
  //             }
  //         });

        
  //         const results = await Promise.all(pausePromises);

        
  //         const successful = results.filter(result => result.success);
  //         const failed = results.filter(result => !result.success);

  //         await userModel.findByIdAndUpdate(req.user._id,{
  //             $set:{
  //                 billingPaused:true
  //             }
  //         })
  
  //         return res.status(200).json({
  //             message: "Billing pause operation completed",
  //             totalOrders: orders.length,
  //             successful: successful.length,
  //             failed: failed.length,
  //             results: {
  //                 successful: successful,
  //                 failed: failed
  //             }
  //         });

  //     } catch (e) {
  //         console.log("Pause billing error:", e.message);
  //         return res.status(500).json({
  //             error: "Facing issue while pausing billing please try again",
  //             details: e.message
  //         });
  //     }
  // }





  // module.exports.resumeBilling = async (req, res) => {
  //     try {
  //         const stripe = require('stripe')(process.env.STRIPE_LIVE);
      
  //         let orders = await orderModel.find({
  //             status: 'paused'
  //         });
      
  //         orders=orders?.filter(u=>u?.user?.toString()==req?.user?._id?.toString())

  //         if (orders.length === 0) {
  //             return res.status(400).json({
  //                 error: "No paused subscriptions found to resume"
  //             });
  //         }

  //         const resumePromises = orders.map(async (order) => {
  //             try {
  //                 if (!order.subscriptionId) {
  //                     return { orderId: order._id, success: false, error: 'No subscription ID' };
  //                 }

  //                 const subscription = await stripe.subscriptions.update(
  //                     order.subscriptionId,
  //                     {
  //                         pause_collection: '',
  //                     }
  //                 );

                  
  //                 await orderModel.findByIdAndUpdate(order._id, {
  //                     status: 'active',
  //                     resumedAt: new Date(),
  //                     $unset: { pausedAt: 1 } 
  //                 });

  //                 await userModel.findByIdAndUpdate(req.user._id,{
  //                     $set:{
  //                         billingPaused:false
  //                     }
  //                 })
  //                 return { 
  //                     orderId: order._id, 
  //                     subscriptionId: order.subscriptionId,
  //                     success: true, 
  //                     subscription: subscription 
  //                 };

  //             } catch (error) {
  //                 console.log(`Error resuming subscription ${order.subscriptionId}:`, error.message);
  //                 return { 
  //                     orderId: order._id, 
  //                     subscriptionId: order.subscriptionId,
  //                     success: false, 
  //                     error: error.message 
  //                 };
  //             }
  //         });

  //         const results = await Promise.all(resumePromises);
  //         const successful = results.filter(result => result.success);
  //         const failed = results.filter(result => !result.success);

  //         return res.status(200).json({
  //             message: "Billing resume operation completed",
  //             totalOrders: orders.length,
  //             successful: successful.length,
  //             failed: failed.length,
  //             results: {
  //                 successful: successful,
  //                 failed: failed
  //             }
  //         });

  //     } catch (e) {
  //         console.log("Resume billing error:", e.message);
  //         return res.status(500).json({
  //             error: "Facing issue while resuming billing please try again",
  //             details: e.message
  //         });
  //     }
  // }





  // module.exports.handleStripeConnectWebhook = async (req, res) => {
  //   const stripe = require('stripe')(process.env.STRIPE_LIVE);
  //   const endpointSecret = "whsec_1QTQ8XtkP0rFEVQbyWj282ebsc1WArsZ";
  //   // const endpointSecret = "whsec_b82d718fbae44ab38035f9ce59915a1c5c7870d001c5d90f38cab27b8e52a15c";
  //   const sig = req.headers['stripe-signature'];

  //   let event;
    
  //   try {
  //     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  //   } catch (err) {
  //     console.error('⚠️ Webhook signature verification failed:', err.message);
  //     return res.status(400).send(`Webhook Error: ${err.message}`);
  //   }
    
  //   console.log('✅ Webhook received:', event.type);
    
  //   try {
  //     switch (event.type) {
  //       case 'account.updated':
    
  //         await handleAccountUpdated(event.data.object, stripe);
  //         break;
        
  //       case 'account.external_account.created':
  //         await handleExternalAccountCreated(event.data.object);
  //         break;
        
  //       case 'capability.updated':
  //         await handleCapabilityUpdated(event.data.object, stripe);
  //         break;
        
  //       case 'account.application.authorized':
  //         await handleAccountAuthorized(event.data.object, stripe);
  //         break;
        
      
        
  //         case 'payout.failed':
  //           await handlePayoutFailed(event.data.object, stripe);
  //           break;

  //           case 'invoice.payment_succeeded':
  //             await handleSubscriptionPaymentSucceeded(event.data.object, stripe);
  //             break;
            
  //             case 'invoice.payment_failed':
  //               await handleSubscriptionPaymentFailed(event.data.object, stripe);
  //               break;
  //       default:
  //         console.log(`Unhandled event type: ${event.type}`);
  //     }
      
  //     res.json({ received: true });
      
  //   } catch (error) {
  //     console.error('Error processing webhook:', error);
  //     res.status(500).json({ error: 'Webhook processing failed' });
  //   }
  // };


  // // Updated handleAccountUpdated function - recognizes when banking is complete

  // async function handleAccountUpdated(accountFromWebhook, stripe) {
  //   console.log('📝 Processing account.updated for:', accountFromWebhook.id);
    
  //   try {
  //     const vendor = await Vendor.findOne({ stripe_account_id: accountFromWebhook.id });
      
  //     if (!vendor) {
  //       console.log('⚠️ No vendor found for account:', accountFromWebhook.id);
  //       return;
  //     }
      
  //     console.log('🔄 Fetching fresh account data from Stripe API...');
  //     const account = await stripe.accounts.retrieve(accountFromWebhook.id);
      
  //     // Critical requirements that MUST be completed for banking
  //     const criticalRequirements = ['external_account', 'tos_acceptance.date', 'tos_acceptance.ip'];
  //     const currentlyDue = account.requirements?.currently_due || [];
      
  //     // Banking is complete when NO critical requirements are in currently_due
  //     const hasCriticalRequirements = criticalRequirements.some(req => currentlyDue.includes(req));
  //     const bankingComplete = !hasCriticalRequirements;
      
  //     // Full onboarding check (stricter - for future use)
  //     const isFullyOnboarded =
  //       account.details_submitted === true &&
  //       account.payouts_enabled === true &&
  //       currentlyDue.length === 0;
      
  //     console.log('============ FRESH ACCOUNT STATUS ============');
  //     console.log('Vendor ID:', vendor._id);
  //     console.log('Account ID:', account.id);
  //     console.log('charges_enabled:', account.charges_enabled);
  //     console.log('payouts_enabled:', account.payouts_enabled);
  //     console.log('details_submitted:', account.details_submitted);
  //     console.log('transfers_capability:', account.capabilities?.transfers);
  //     console.log('Has critical requirements:', hasCriticalRequirements);
  //     console.log('bankingComplete:', bankingComplete);
  //     console.log('isFullyOnboarded:', isFullyOnboarded);
  //     console.log('Currently due:', currentlyDue);
  //     console.log('Eventually due:', account.requirements?.eventually_due);
  //     console.log('External accounts:', account.external_accounts?.data?.length || 0);
  //     console.log('=============================================');
      
  //     // UPDATE: Set stripe_connect_status based on banking completion
  //     const updateData = {
  //       stripe_account_id: account.id,
  //       stripeAccountData: {
  //         chargesEnabled: account.charges_enabled,
  //         payoutsEnabled: account.payouts_enabled,
  //         detailsSubmitted: account.details_submitted,
  //         transfersCapability: account.capabilities?.transfers,
  //         country: account.country,
  //         defaultCurrency: account.default_currency,
  //         currentlyDue: currentlyDue,
  //         eventuallyDue: account.requirements?.eventually_due || [],
  //         hasBankAccount: account.external_accounts?.data?.length > 0,
  //         bankingComplete: bankingComplete,
  //         fullyOnboarded: isFullyOnboarded,
  //         lastUpdated: new Date()
  //       }
  //     };

  //     // THIS IS THE KEY FIX: Set stripe_connect_status when banking is complete
  //     if (bankingComplete) {
  //       updateData.stripe_connect_status = true;
  //       console.log('🎉 Setting stripe_connect_status to TRUE');
  //     } else {
  //       updateData.stripe_connect_status = false;
  //       console.log('⏳ Setting stripe_connect_status to FALSE - requirements pending');
  //     }
  //     const updatedVendor = await Vendor.findOneAndUpdate(
  //       { email: vendor.email },
  //       {
  //         $set: {
  //           stripe_connect_status: isFullyOnboarded,
  //         }
  //       },
  //       { new: true } 
  //     );
      
  //     console.log('💾 Database updated. stripe_connect_status:', updatedVendor.stripe_connect_status);
      
  //     // Send email notification based on status change
  //     const wasNotComplete = !vendor.stripeAccountData?.bankingComplete;
      
  //     if (bankingComplete && wasNotComplete) {
  //       console.log('✅✅✅ BANKING SETUP COMPLETE ✅✅✅');
  //       console.log('Vendor:', updatedVendor._id);
  //       console.log('Status in DB:', updatedVendor.stripe_connect_status);
  //       await sendBankingSuccessEmail(vendor, account);
  //     } else if (!bankingComplete) {
  //       console.log('⏳ VENDOR ONBOARDING INCOMPLETE');
  //       console.log('Vendor:', vendor._id);
  //       console.log('Missing critical requirements:', currentlyDue.filter(req => criticalRequirements.includes(req)));
  //     } else {
  //       console.log('ℹ️ Status unchanged - banking already complete');
  //     }
      
  //   } catch (error) {
  //     console.error('❌ Error handling account.updated:', error);
  //     throw error;
  //   }
  // }

  // // Also handle when external account is explicitly created
  // async function handleExternalAccountCreated(externalAccount, stripe) {
  //   console.log('🏦 External account created:', externalAccount.id);
    
  //   try {
  //     const vendor = await Vendor.findOne({ 
  //       stripe_account_id: externalAccount.account 
  //     });
      
  //     if (vendor) {
  //       console.log('✅ Bank account added for vendor:', vendor._id);
        
  //       // Fetch full account to check complete status
  //       const account = await stripe.accounts.retrieve(externalAccount.account);
  //       const currentlyDue = account.requirements?.currently_due || [];
  //       const criticalRequirements = ['external_account', 'tos_acceptance.date', 'tos_acceptance.ip'];
  //       const hasCriticalRequirements = criticalRequirements.some(req => currentlyDue.includes(req));
  //       const bankingComplete = !hasCriticalRequirements;
        
  //       await Vendor.findByIdAndUpdate(vendor._id, {
  //         $set: {
  //           'stripeAccountData.hasBankAccount': true,
  //           'stripeAccountData.bankAccountLast4': externalAccount.last4,
  //           'stripeAccountData.bankAccountStatus': externalAccount.status,
  //           'stripeAccountData.bankingComplete': bankingComplete,
  //           // Set connect status to true if banking is complete
  //           ...(bankingComplete && { stripe_connect_status: true })
  //         }
  //       });
        
  //       console.log('💡 Banking status updated. Complete:', bankingComplete);
        
  //       if (bankingComplete) {
  //         await sendBankingSuccessEmail(vendor, account);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error handling external_account.created:', error);
  //   }
  // }

  // async function handleExternalAccountCreated(externalAccount) {
  //   console.log('🏦 External account created:', externalAccount.id);
    
  //   try {
  //     const vendor = await Vendor.findOne({ 
  //       stripe_account_id: externalAccount.account 
  //     });
      
  //     if (vendor) {
  //       console.log('✅ Bank account added for vendor:', vendor._id);
        
  //       // Fetch full account to check complete status
  //       const stripe = require('stripe')(process.env.STRIPE_LIVE);
  //       const account = await stripe.accounts.retrieve(externalAccount.account);
  //       const currentlyDue = account.requirements?.currently_due || [];
  //       const criticalRequirements = ['external_account', 'tos_acceptance.date', 'tos_acceptance.ip'];
  //       const hasCriticalRequirements = criticalRequirements.some(req => currentlyDue.includes(req));
  //       const bankingComplete = !hasCriticalRequirements;
        
  //       console.log('🔍 After bank account added:');
  //       console.log('   Currently due:', currentlyDue);
  //       console.log('   Banking complete:', bankingComplete);
        
  //       const updateData = {
  //         'stripeAccountData.hasBankAccount': true,
  //         'stripeAccountData.bankAccountLast4': externalAccount.last4,
  //         'stripeAccountData.bankAccountStatus': externalAccount.status,
  //         'stripeAccountData.bankingComplete': bankingComplete,
  //         'stripeAccountData.currentlyDue': currentlyDue
  //       };
        
  //       // Set stripe_connect_status if banking is complete
  //       if (bankingComplete) {
  //         updateData.stripe_connect_status = true;
  //         console.log('✅ Setting stripe_connect_status to TRUE via external_account.created');
  //       }
        
  //       await Vendor.findByIdAndUpdate(vendor._id, {
  //         $set: updateData
  //       });
        
  //       console.log('💡 Banking status updated. Connect status:', bankingComplete);
        
  //       if (bankingComplete) {
  //         await sendBankingSuccessEmail(vendor, account);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error handling external_account.created:', error);
  //   }
  // }

  // async function handleCapabilityUpdated(capability, stripe) {
  //   console.log('⚡ Capability updated:', capability.id, 'Status:', capability.status);
    
  //   try {
  //     const vendor = await Vendor.findOne({ 
  //       stripe_account_id: capability.account 
  //     });
      
  //     if (vendor) {
  //       await Vendor.findByIdAndUpdate(vendor._id, {
  //         $set: {
  //           [`stripeAccountData.${capability.id}Capability`]: capability.status
  //         }
  //       });
        
  //       if (capability.id === 'transfers' && capability.status === 'active') {
  //         console.log('✅ TRANSFERS CAPABILITY ACTIVE for vendor:', vendor._id);
          
          
  //         console.log('🔄 Fetching full account data after transfers activated...');
  //         const account = await stripe.accounts.retrieve(capability.account);
          
  //         const isFullyOnboarded = account.charges_enabled && 
  //                                 account.payouts_enabled &&
  //                                 account.details_submitted &&
  //                                 account.capabilities?.transfers === 'active';
          
  //         await Vendor.findByIdAndUpdate(vendor._id, {
  //           $set: {
  //             stripe_connect_status: isFullyOnboarded,
  //             stripeAccountData: {
  //               chargesEnabled: account.charges_enabled,
  //               payoutsEnabled: account.payouts_enabled,
  //               detailsSubmitted: account.details_submitted,
  //               transfersCapability: account.capabilities?.transfers,
  //               country: account.country,
  //               defaultCurrency: account.default_currency,
  //               currentlyDue: account.requirements?.currently_due || [],
  //               eventuallyDue: account.requirements?.eventually_due || [],
  //               lastUpdated: new Date()
  //             }
  //           }
  //         });
          
  //         console.log('✅ Full account status updated. Onboarded:', isFullyOnboarded);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error handling capability.updated:', error);
  //   }
  // }

  // async function handleAccountAuthorized(application, stripe) {
  //   console.log('✅ Account authorized:', application.account);
    
  //   try {
  //     const vendor = await Vendor.findOne({ 
  //       stripe_account_id: application.account 
  //     });
      
  //     if (vendor) {
  //       await Vendor.findByIdAndUpdate(vendor._id, {
  //         $set: {
  //           'stripeAccountData.applicationStatus': 'authorized'
  //         }
  //       });
  //       console.log('✅ Application authorized for vendor:', vendor._id);
        

  //       console.log('🔄 Fetching full account data after authorization...');
  //       const account = await stripe.accounts.retrieve(application.account);
        
  //       const isFullyOnboarded = account.charges_enabled && 
  //                               account.payouts_enabled &&
  //                               account.details_submitted &&
  //                               account.capabilities?.transfers === 'active';
        
  //       await Vendor.findByIdAndUpdate(vendor._id, {
  //         $set: {
  //           stripe_connect_status: isFullyOnboarded,
  //           stripeAccountData: {
  //             chargesEnabled: account.charges_enabled,
  //             payoutsEnabled: account.payouts_enabled,
  //             detailsSubmitted: account.details_submitted,
  //             transfersCapability: account.capabilities?.transfers,
  //             country: account.country,
  //             defaultCurrency: account.default_currency,
  //             currentlyDue: account.requirements?.currently_due || [],
  //             eventuallyDue: account.requirements?.eventually_due || [],
  //             lastUpdated: new Date()
  //           }
  //         }
  //       });
        
  //       console.log('✅ Full account status updated. Onboarded:', isFullyOnboarded);
  //     }
  //   } catch (error) {
  //     console.error('Error handling account.application.authorized:', error);
  //   }
  // }


  //   async function handleExternalAccountCreated(externalAccount) {
  //     console.log('🏦 External account created:', externalAccount.id);
      
  //     try {
  //       const vendor = await Vendor.findOne({ 
  //         stripe_account_id: externalAccount.account 
  //       });
        
  //       if (vendor) {
  //         console.log('✅ Bank account added for vendor:', vendor._id);
          

  //         await Vendor.findByIdAndUpdate(vendor._id, {
  //           $set: {
  //             'stripeAccountData.hasBankAccount': true,
  //             'stripeAccountData.bankAccountLast4': externalAccount.last4,
  //             'stripeAccountData.bankAccountStatus': externalAccount.status
  //           }
  //         });
  //       }
  //     } catch (error) {
  //       console.error('Error handling external_account.created:', error);
  //     }
  //   }
    
  //   /**
  //    * Handle capability.updated event
  //    * Transfers capability is what allows receiving payments
  //    */
  //   async function handleCapabilityUpdated(capability) {
  //     console.log('⚡ Capability updated:', capability.id, capability.status);
      
  //     try {
  //       const vendor = await Vendor.findOne({ 
  //         stripe_account_id: capability.account 
  //       });
        
  //       if (vendor && capability.id === 'transfers') {
  //         const isActive = capability.status === 'active';
          
  //         await Vendor.findByIdAndUpdate(vendor._id, {
  //           $set: {
  //             'stripeAccountData.transfersCapability': capability.status
  //           }
  //         });
          
  //         if (isActive) {
  //           console.log('✅ Transfers capability ACTIVE for vendor:', vendor._id);
  //         } else {
  //           console.log('⏳ Transfers capability status:', capability.status);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error handling capability.updated:', error);
  //     }
  //   }
    
  //   /**
  //    * Handle account.application.authorized event
  //    * Account successfully connected
  //    */
  //   async function handleAccountAuthorized(application) {
  //     console.log('✅ Account authorized:', application.account);
      
  //     try {
  //       const vendor = await Vendor.findOne({ 
  //         stripe_account_id: application.account 
  //       });
        
  //       if (vendor) {
  //         await Vendor.findByIdAndUpdate(vendor._id, {
  //           $set: {
  //             'stripeAccountData.applicationStatus': 'authorized'
  //           }
  //         });
  //         console.log('✅ Application authorized for vendor:', vendor._id);
  //       }
  //     } catch (error) {
  //       console.error('Error handling account.application.authorized:', error);
  //     }
  //   }
    


    



  //   async function sendBankingSuccessEmail(vendor, account) {
  //     try {
    
  //       const mailOptions = {
  //         from: 'orders@enrichifydata.com',
  //         to: vendor.email,
  //         subject: 'Banking Setup Complete - Ready to Receive Payments! - RentSimple',
  //         html: `
  //           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  //             <!-- Header -->
  //             <div style="background-color: #28a745; padding: 30px; text-align: center;">
  //               <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Banking Setup Complete!</h1>
  //               <p style="color: #d4edda; margin-top: 10px; font-size: 16px;">You're ready to receive payments</p>
  //             </div>
              
  //             <!-- Success Time -->
  //             <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
  //               <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Activated On</p>
  //               <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
  //                 dateStyle: 'full', 
  //                 timeStyle: 'short' 
  //               })}</h2>
  //             </div>
    
  //             <!-- Main Content -->
  //             <div style="padding: 30px;">
  //               <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
  //                 Congratulations!
  //               </h3>
                
  //               <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
  //                 Hello <strong>${vendor.name || vendor.username}</strong>,
  //               </p>
                
  //               <p style="color: #495057; font-size: 16px; line-height: 1.6;">
  //                 Great news! Your Stripe banking setup is now complete and verified. You can now receive payments from renters directly to your bank account.
  //               </p>
    
  //               <!-- Success Banner -->
  //               <div style="margin-top: 30px; padding: 25px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px; text-align: center;">
  //                 <h2 style="margin: 0; color: #155724; font-size: 24px;">✅ All Systems Ready</h2>
  //                 <p style="margin: 10px 0 0 0; color: #155724; font-size: 16px;">Your account is fully set up to receive payments</p>
  //               </div>
    
  //               <!-- Account Status -->
  //               <div style="margin-top: 30px;">
  //                 <h4 style="color: #2c3e50; margin-bottom: 15px;">Your Account Status:</h4>
  //                 <table style="width: 100%; border-collapse: collapse;">
  //                   <tr>
  //                     <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; width: 50%;">Account Status</td>
  //                     <td style="padding: 12px; border: 1px solid #dee2e6;">
  //                       <span style="background-color: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">ACTIVE</span>
  //                     </td>
  //                   </tr>
  //                   <tr>
  //                     <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Payouts Enabled</td>
  //                     <td style="padding: 12px; border: 1px solid #dee2e6;">
  //                       <span style="color: #28a745; font-weight: 600;">✅ Yes</span>
  //                     </td>
  //                   </tr>
  //                   <tr>
  //                     <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Transfers Capability</td>
  //                     <td style="padding: 12px; border: 1px solid #dee2e6;">
  //                       <span style="color: #28a745; font-weight: 600;">✅ Active</span>
  //                     </td>
  //                   </tr>
  //                   <tr>
  //                     <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Country</td>
  //                     <td style="padding: 12px; border: 1px solid #dee2e6;">${account.country || 'US'}</td>
  //                   </tr>
  //                   <tr>
  //                     <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Currency</td>
  //                     <td style="padding: 12px; border: 1px solid #dee2e6;">${(account.default_currency || 'usd').toUpperCase()}</td>
  //                   </tr>
  //                 </table>
  //               </div>
    
  //               <!-- What's Next -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">📌 What's Next?</h4>
  //                 <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460; line-height: 1.8;">
  //                   <li>Start listing your appliances for rent</li>
  //                   <li>Approve rental requests from customers</li>
  //                   <li>Receive payments directly to your bank account</li>
  //                   <li>Track your earnings in the vendor dashboard</li>
  //                 </ul>
  //               </div>
    
  //               <!-- Payment Timeline -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">💰 Payment Information</h4>
  //                 <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
  //                   When a rental is confirmed, payments will be automatically transferred to your connected bank account. Funds typically arrive within 2-7 business days.
  //                 </p>
  //               </div>
    
  //               <!-- Call to Action Button -->
  //               <div style="text-align: center; margin-top: 30px;">
  //                 <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
  //                   style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
  //                   Go to Dashboard
  //                 </a>
  //               </div>
    
  //               <!-- Support Info -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
  //                 <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
  //                   If you have any questions about receiving payments or managing your account, our support team is ready to assist you.
  //                 </p>
  //               </div>
    
  //               <!-- Account ID -->
  //               <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
  //                 <p style="margin: 0; color: #6c757d; font-size: 12px;">Stripe Account ID: <strong>${account.id}</strong></p>
  //               </div>
  //             </div>
    
  //             <!-- Footer -->
  //             <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
  //               <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
  //                 This is an automated notification from RentSimple.
  //               </p>
  //               <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
  //                 © 2025 RentSimple. All rights reserved.
  //               </p>
  //             </div>
  //           </div>
  //         `
  //       };
    
  //       await transporter.sendMail(mailOptions);
  //       console.log('📧 Banking success email sent to:', vendor.email);
  //     } catch (error) {
  //       console.error('Error sending banking success email:', error);
  //     }
  //   }



  //   async function handleSubscriptionPaymentSucceeded(invoice, stripe) {
  //     console.log('💰 Subscription payment succeeded:', invoice.id);
      
  //     try {
  //       // Get subscription details

  //       // Find the order/request associated with this subscription
  //       const order = await orderModel.findOne({ subscriptionId: invoice.subscription })
  //         .populate('vendor')
  //         .populate('user')
  //         .populate('listing');
        
  //       if (!order || !order.vendor) {
  //         console.log('⚠️ No order or vendor found for subscription:', invoice.subscription);
  //         return;
  //       }
        
  //       const vendor = order.vendor;
        
  //       const mailOptions = {
  //         from: 'orders@enrichifydata.com',
  //         to: vendor.email,
  //         subject: 'Monthly Rental Payment Received - RentSimple',
  //         html: `
  //           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  //             <!-- Header -->
  //             <div style="background-color: #28a745; padding: 30px; text-align: center;">
  //               <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💰 Payment Received!</h1>
  //               <p style="color: #d4edda; margin-top: 10px; font-size: 16px;">Monthly rental payment processed successfully</p>
  //             </div>
              
  //             <!-- Payment Time -->
  //             <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
  //               <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Payment Date</p>
  //               <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date(invoice.created * 1000).toLocaleString('en-US', { 
  //                 dateStyle: 'full', 
  //                 timeStyle: 'short' 
  //               })}</h2>
  //             </div>
    
  //             <!-- Payment Amount -->
  //             <div style="padding: 30px;">
  //               <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
  //                 <p style="margin: 0; color: #155724; font-size: 16px; font-weight: 600;">Payment Amount</p>
  //                 <h1 style="margin: 10px 0 0 0; color: #28a745; font-size: 42px; font-weight: 700;">$${(invoice.amount_paid / 100).toFixed(2)}</h1>
  //               </div>
    
  //               <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
  //                 Payment Details
  //               </h3>
                
  //               <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Invoice ID</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">${invoice.id}</td>
  //                 </tr>
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Subscription ID</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">${invoice.subscription}</td>
  //                 </tr>
  //                 ${order.listing ? `
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Product</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.listing.title}</td>
  //                 </tr>
  //                 ` : ''}
  //                 ${order.user ? `
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Customer</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.user.name || order.user.email}</td>
  //                 </tr>
  //                 ` : ''}
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Payment Status</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6;">
  //                     <span style="background-color: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">PAID</span>
  //                   </td>
  //                 </tr>
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Period</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">
  //                     ${new Date(invoice.period_start * 1000).toLocaleDateString()} - ${new Date(invoice.period_end * 1000).toLocaleDateString()}
  //                   </td>
  //                 </tr>
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Amount Paid</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745; font-weight: 700; font-size: 18px;">$${(invoice.amount_paid / 100).toFixed(2)}</td>
  //                 </tr>
  //               </table>
    
  //               <!-- Payout Info -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💸 Payout Information</h4>
  //                 <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
  //                   Your payout will be processed automatically and transferred to your bank account within 2-7 business days.
  //                 </p>
  //               </div>
    
  //               <!-- Call to Action Button -->
  //               <div style="text-align: center; margin-top: 30px;">
  //                 <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
  //                   style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
  //                   View Order Details
  //                 </a>
  //               </div>
    
  //               <!-- Support Info -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
  //                 <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
  //                   If you have any questions about this payment or need assistance, please contact our support team.
  //                 </p>
  //               </div>
  //             </div>
    
  //             <!-- Footer -->
  //             <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
  //               <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
  //                 This is an automated notification from RentSimple.
  //               </p>
  //               <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
  //                 © 2025 RentSimple. All rights reserved.
  //               </p>
  //             </div>
  //           </div>
  //         `
  //       };
    
  //       const transporter = nodemailer.createTransport({
  //         service: 'gmail',
  //         auth: {
  //           user: 'rentsimple159@gmail.com', 
  //           pass: 'upqbbmeobtztqxyg' 
  //         }
  //       });
    
  //       await transporter.sendMail(mailOptions);
  //       console.log('📧 Subscription payment success email sent to:', vendor.email);
        
  //     } catch (error) {
  //       console.error('Error handling subscription payment succeeded:', error);
  //     }
  //   }
  //   async function handleSubscriptionPaymentFailed(invoice, stripe) {
  //     console.log('❌ Subscription payment failed:', invoice.id);
      
  //     try {
  //       // Find the order/request associated with this subscription
  //       const order = await orderModel.findOne({ subscriptionId: invoice.subscription })
  //         .populate('vendor')
  //         .populate('user')
  //         .populate('listing');
        
  //       if (!order || !order.vendor) {
  //         console.log('⚠️ No order or vendor found for subscription:', invoice.subscription);
  //         return;
  //       }
        
  //       const vendor = order.vendor;
        
  //       const mailOptions = {
  //         from: 'orders@enrichifydata.com',
  //         to: vendor.email,
  //         subject: 'Payment Failed - Action May Be Required - RentSimple',
  //         html: `
  //           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  //             <!-- Header -->
  //             <div style="background-color: #dc3545; padding: 30px; text-align: center;">
  //               <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Payment Failed</h1>
  //               <p style="color: #f8d7da; margin-top: 10px; font-size: 16px;">Monthly rental payment unsuccessful</p>
  //             </div>
              
  //             <!-- Alert Time -->
  //             <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
  //               <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Failed On</p>
  //               <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date(invoice.created * 1000).toLocaleString('en-US', { 
  //                 dateStyle: 'full', 
  //                 timeStyle: 'short' 
  //               })}</h2>
  //             </div>
    
  //             <!-- Main Content -->
  //             <div style="padding: 30px;">
  //               <h3 style="color: #2c3e50; border-bottom: 2px solid #dc3545; padding-bottom: 10px; margin-top: 0;">
  //                 Payment Attempt Failed
  //               </h3>
                
  //               <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
  //                 Hello <strong>${vendor.name || vendor.username}</strong>,
  //               </p>
                
  //               <p style="color: #495057; font-size: 16px; line-height: 1.6;">
  //                 We're writing to inform you that a monthly rental payment from your customer has failed. The customer has been notified and Stripe will automatically retry the payment.
  //               </p>
    
  //               <!-- Failed Payment Details -->
  //               <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Invoice ID</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">${invoice.id}</td>
  //                 </tr>
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Subscription ID</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">${invoice.subscription}</td>
  //                 </tr>
  //                 ${order.listing ? `
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Product</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.listing.title}</td>
  //                 </tr>
  //                 ` : ''}
  //                 ${order.user ? `
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Customer</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.user.name || order.user.email}</td>
  //                 </tr>
  //                 ` : ''}
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Attempted Amount</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545; font-weight: 700; font-size: 18px;">$${(invoice.amount_due / 100).toFixed(2)}</td>
  //                 </tr>
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Attempt Count</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${invoice.attempt_count || 1}</td>
  //                 </tr>
  //               </table>
    
  //               <!-- What Happens Next -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">📌 What Happens Next?</h4>
  //                 <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460; line-height: 1.8;">
  //                   <li>Stripe will automatically retry the payment</li>
  //                   <li>The customer has been notified to update their payment method</li>
  //                   <li>You'll receive an update once payment is successful</li>
  //                   <li>If payment continues to fail, you may need to contact the customer</li>
  //                 </ul>
  //               </div>
    
  //               <!-- Important Notice -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⚠️ Action May Be Required</h4>
  //                 <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
  //                   If the payment continues to fail after multiple attempts, you may need to contact your customer directly or consider pausing the rental agreement.
  //                 </p>
  //               </div>
    
  //               <!-- Call to Action Button -->
  //               <div style="text-align: center; margin-top: 30px;">
  //                 <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
  //                   style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
  //                   View Order Details
  //                 </a>
  //               </div>
    
  //               <!-- Support Info -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
  //                 <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
  //                   If you need assistance managing this situation or have questions, please contact our support team.
  //                 </p>
  //               </div>
  //             </div>
    
  //             <!-- Footer -->
  //             <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
  //               <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
  //                 This is an automated notification from RentSimple.
  //               </p>
  //               <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
  //                 © 2025 RentSimple. All rights reserved.
  //               </p>
  //             </div>
  //           </div>
  //         `
  //       };
    
  //       const transporter = nodemailer.createTransport({
  //         service: 'gmail',
  //         auth: {
  //           user: 'rentsimple159@gmail.com', 
  //           pass: 'upqbbmeobtztqxyg' 
  //         }
  //       });
    
  //       await transporter.sendMail(mailOptions);
  //       console.log('📧 Subscription payment failed email sent to:', vendor.email);
        
  //     } catch (error) {
  //       console.error('Error handling subscription payment failed:', error);
  //     }
  //   }

    
  //   async function handlePayoutFailed(payout, stripe) {
  //     console.log('❌ Payout failed:', payout.id);
      
  //     try {
  //       // Get the account this payout belongs to
  //       const vendor = await Vendor.findOne({ stripe_account_id: payout.destination });
        
  //       if (!vendor) {
  //         console.log('⚠️ No vendor found for payout:', payout.id);
  //         return;
  //       }
        
  //       const mailOptions = {
  //         from: 'orders@enrichifydata.com',
  //         to: vendor.email,
  //         subject: 'Urgent: Payout Failed - Update Banking Information - RentSimple',
  //         html: `
  //           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  //             <!-- Header -->
  //             <div style="background-color: #dc3545; padding: 30px; text-align: center;">
  //               <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚨 Payout Failed</h1>
  //               <p style="color: #f8d7da; margin-top: 10px; font-size: 16px;">Action required to receive your payments</p>
  //             </div>
              
  //             <!-- Alert Time -->
  //             <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
  //               <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Failed On</p>
  //               <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date(payout.created * 1000).toLocaleString('en-US', { 
  //                 dateStyle: 'full', 
  //                 timeStyle: 'short' 
  //               })}</h2>
  //             </div>
    
  //             <!-- Main Content -->
  //             <div style="padding: 30px;">
  //               <h3 style="color: #2c3e50; border-bottom: 2px solid #dc3545; padding-bottom: 10px; margin-top: 0;">
  //                 Payout Transfer Failed
  //               </h3>
                
  //               <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
  //                 Hello <strong>${vendor.name || vendor.username}</strong>,
  //               </p>
                
  //               <p style="color: #495057; font-size: 16px; line-height: 1.6;">
  //                 Unfortunately, we were unable to transfer a payout to your bank account. This usually happens due to outdated or incorrect banking information.
  //               </p>
    
  //               <!-- Failed Payout Details -->
  //               <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; border-radius: 4px; margin: 20px 0;">
  //                 <h4 style="margin: 0 0 10px 0; color: #721c24; font-size: 18px;">Failed Payout Amount</h4>
  //                 <h1 style="margin: 0; color: #dc3545; font-size: 36px; font-weight: 700;">$${(payout.amount / 100).toFixed(2)}</h1>
  //               </div>
    
  //               <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Payout ID</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">${payout.id}</td>
  //                 </tr>
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6;">
  //                     <span style="background-color: #dc3545; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">FAILED</span>
  //                   </td>
  //                 </tr>
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Failure Code</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${payout.failure_code || 'Not specified'}</td>
  //                 </tr>
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Failure Message</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${payout.failure_message || 'Bank account information may be invalid or outdated'}</td>
  //                 </tr>
  //                 <tr>
  //                   <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Amount</td>
  //                   <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545; font-weight: 700; font-size: 18px;">$${(payout.amount / 100).toFixed(2)}</td>
  //                 </tr>
  //               </table>
    
  //               <!-- Common Reasons -->
  //               <div style="margin-top: 30px;">
  //                 <h4 style="color: #2c3e50; margin-bottom: 15px;">Common Reasons for Payout Failures:</h4>
  //                 <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
  //                   <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
  //                     <li>Incorrect bank account or routing number</li>
  //                     <li>Bank account closed or frozen</li>
  //                     <li>Bank doesn't accept ACH transfers</li>
  //                     <li>Account holder name mismatch</li>
  //                     <li>Outdated banking information</li>
  //                   </ul>
  //                 </div>
  //               </div>
    
  //               <!-- Urgent Action Required -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #721c24; font-size: 16px;">🚨 Immediate Action Required</h4>
  //                 <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.6;">
  //                   You must update your banking information in Stripe immediately to receive this payout and future payments. Your funds are safe but cannot be transferred until your banking details are correct.
  //                 </p>
  //               </div>
    
  //               <!-- Call to Action Button -->
  //               <div style="text-align: center; margin-top: 30px;">
  //                 <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
  //                   style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
  //                   Update Banking Information
  //                 </a>
  //               </div>
    
  //               <!-- What Happens to Your Money -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💰 What Happens to Your Money?</h4>
  //                 <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
  //                   Your funds remain secure in your Stripe account. Once you update your banking information, the payout will be automatically retried and transferred to your updated account.
  //                 </p>
  //               </div>
    
  //               <!-- Support Info -->
  //               <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
  //                 <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
  //                 <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
  //                   If you're having trouble updating your banking information or have questions about this failed payout, please contact our support team immediately. We're here to help ensure you receive your payments.
  //                 </p>
  //               </div>
    
  //               <!-- Payout Reference -->
  //               <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
  //                 <p style="margin: 0; color: #6c757d; font-size: 12px;">Payout Reference: <strong>${payout.id}</strong></p>
  //               </div>
  //             </div>
    
  //             <!-- Footer -->
  //             <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
  //               <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
  //                 This is an automated notification from RentSimple.
  //               </p>
  //               <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
  //                 © 2025 RentSimple. All rights reserved.
  //               </p>
  //             </div>
  //           </div>
  //         `
  //       };
    
  //       const transporter = nodemailer.createTransport({
  //         service: 'gmail',
  //         auth: {
  //           user: 'rentsimple159@gmail.com', 
  //           pass: 'upqbbmeobtztqxyg' 
  //         }
  //       });
    
  //       await transporter.sendMail(mailOptions);
  //     }catch(e){


  //     }
  //   }  



  function validateAmount(amount) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }
    return Math.round(numAmount * 100); // Convert to cents
  }
  
  /**
   * Validate currency code
   */
  function validateCurrency(currency) {
    const validCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud'];
    const curr = (currency || 'usd').toLowerCase();
    if (!validCurrencies.includes(curr)) {
      return 'usd';
    }
    return curr;
  }
  
  /**
   * Verify payment method exists and is valid
   */
  async function verifyPaymentMethod(stripe, paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }
      return paymentMethod;
    } catch (error) {
      console.error('❌ Payment method verification failed:', error.message);
      throw new Error(`Invalid payment method: ${error.message}`);
    }
  }
  
  /**
   * Ensure payment method is attached to customer
   */
  async function ensurePaymentMethodAttached(stripe, paymentMethodId, customerId) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (!paymentMethod.customer) {
        console.log(`🔗 Attaching payment method ${paymentMethodId} to customer ${customerId}`);
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        }, {
          idempotencyKey: `attach-${paymentMethodId}-${customerId}`
        });
        return true;
      }
      
      if (paymentMethod.customer !== customerId) {
        console.log(`🔄 Reattaching payment method from ${paymentMethod.customer} to ${customerId}`);
        await stripe.paymentMethods.detach(paymentMethodId, {}, {
          idempotencyKey: `detach-${paymentMethodId}-${Date.now()}`
        });
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        }, {
          idempotencyKey: `attach-${paymentMethodId}-${customerId}`
        });
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error attaching payment method:', error.message);
      throw new Error(`Failed to attach payment method: ${error.message}`);
    }
  }
  
  /**
   * Get or create Stripe customer
   */
  async function getOrCreateCustomer(stripe, user) {
    try {
      if (user.customerId) {
        try {
          const customer = await stripe.customers.retrieve(user.customerId);
          if (!customer.deleted) {
            return customer;
          }
          console.log(`⚠️ Customer ${user.customerId} was deleted. Creating new one...`);
        } catch (error) {
          console.log(`⚠️ Customer ${user.customerId} not found. Creating new one...`);
        }
      }
  
      console.log(`✨ Creating new Stripe customer for user ${user._id}`);
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.username || user.email,
        metadata: {
          userId: user._id.toString()
        }
      }, {
        idempotencyKey: `customer-${user._id.toString()}`
      });
  
      await userModel.findByIdAndUpdate(user._id, {
        $set: { customerId: customer.id }
      });
  
      return customer;
    } catch (error) {
      console.error('❌ Error getting/creating customer:', error.message);
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }








  const orderModel = require('../models/order');
  const userModel = require('../models/user');
  const Vendor=require('../models/vendor')
  const jwt = require('jsonwebtoken');
  const nodemailer=require('nodemailer')

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rentsimple159@gmail.com', 
      pass: 'mlgioecamzoitfdt' 
    }
  });


  module.exports.storeBilling = async (req, res) => {
    const { cardState, draftDay } = req.body;
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    
    try {
        // Validate inputs
        if (!cardState) {
            return res.status(400).json({
                error: "Payment method ID is required"
            });
        }

        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Verify payment method exists
        await verifyPaymentMethod(stripe, cardState);

        // Get or create Stripe customer
        const customer = await getOrCreateCustomer(stripe, user);

        // Attach payment method to customer
        await ensurePaymentMethodAttached(stripe, cardState, customer.id);

        // Create JWT token
        const paymentMethodToken = jwt.sign(
            { paymentMethodId: cardState, draftDay }, 
            process.env.PAYMENT_METHOD_JWT_KEY
        );

        // Update user
        await userModel.findByIdAndUpdate(
            req.user._id, 
            { 
                $set: { 
                    paymentMethodToken,
                    customerId: customer.id 
                } 
            },
            { lean: true }
        );

        return res.status(200).json({
            message: "Billing details saved successfully",
            customerId: customer.id
        });
    } catch (e) {
        console.error("Error storing billing:", e.message);
        return res.status(500).json({
            error: e.message || "Facing issue while storing billing info please try again"
        });
    }
};





module.exports.updatePaymentMethod = async(req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_LIVE);
  const {paymentMethodId} = req.body;
  
  try {
      // Validate input
      if (!paymentMethodId) {
          return res.status(400).json({
              error: "Payment method ID is required"
          });
      }

      let user = await userModel.findOne({_id: req.user._id});
      if (!user) {
          return res.status(404).json({
              error: "User not found"
          });
      }

      // Verify new payment method exists
      await verifyPaymentMethod(stripe, paymentMethodId);

      // Get or create customer if needed
      const customer = await getOrCreateCustomer(stripe, user);

      // Detach old payment method if exists
      if (user.paymentMethodToken) {
          try {
              let oldPaymentMethodData = jwt.verify(
                  user.paymentMethodToken, 
                  process.env.PAYMENT_METHOD_JWT_KEY
              );
              
              if (oldPaymentMethodData.paymentMethodId) {
                  try {
                    await stripe.paymentMethods.detach(oldPaymentMethodData.paymentMethodId, {}, {
                      idempotencyKey: `detach-old-${oldPaymentMethodData.paymentMethodId}-${Date.now()}`
                    });
                      console.log(`🗑️ Detached old payment method: ${oldPaymentMethodData.paymentMethodId}`);
                  } catch (detachError) {
                      console.log(`⚠️ Could not detach old payment method: ${detachError.message}`);
                  }
              }
          } catch (jwtError) {
              console.log(`⚠️ Could not decode old payment token: ${jwtError.message}`);
          }
      }

      // Attach new payment method
      await ensurePaymentMethodAttached(stripe, paymentMethodId, customer.id);

      // Get draft day from old token or use default
      let draftDay = 1;
      if (user.paymentMethodToken) {
          try {
              let paymentMethodData = jwt.verify(
                  user.paymentMethodToken, 
                  process.env.PAYMENT_METHOD_JWT_KEY
              );
              draftDay = paymentMethodData.draftDay || 1;
          } catch (e) {
              console.log('Using default draft day');
          }
      }

      // Create new token
      let paymentMethodToken = jwt.sign(
          {paymentMethodId: paymentMethodId, draftDay: draftDay}, 
          process.env.PAYMENT_METHOD_JWT_KEY
      );

      // Update user
      await userModel.findByIdAndUpdate(req.user._id, {
          $set: {
              paymentMethodToken,
              customerId: customer.id
          }
      });

      return res.status(200).json({
          message: "Billing info updated successfully"
      });
  } catch(e) {
      console.error('❌ Update payment method error:', e.message);
      return res.status(500).json({
          error: e.message || "Facing issue while updating billing info please try again",
          details: e.message
      });
  }
}



  module.exports.pauseBilling = async (req, res) => {
      try {
          const stripe = require('stripe')(process.env.STRIPE_LIVE);
        
          let orders = await orderModel.find({
              
              status: { $in: ['confirmed'] }
          });
          
          orders=orders?.filter(u=>u?.user?.toString()==req?.user?._id?.toString())


          if (orders.length === 0) {
              return res.status(400).json({
                  error: "No active subscriptions found to pause"
              });
          }

        
          const pausePromises = orders.map(async (order) => {
              try {
                
                  if (!order.subscriptionId) {
                      console.log(`Order ${order._id} has no subscription ID`);
                      return { orderId: order._id, success: false, error: 'No subscription ID' };
                  }

                  const subscription = await stripe.subscriptions.update(
                    order.subscriptionId,
                    {
                      pause_collection: {
                        behavior: 'void', 
                      },
                    },
                    {
                      idempotencyKey: `pause-${order.subscriptionId}-${Date.now()}`
                    }
                  );

              
                  await orderModel.findByIdAndUpdate(order._id, {
                      status: 'paused',
                      pausedAt: new Date()
                  });

                  return { 
                      orderId: order._id, 
                      subscriptionId: order.subscriptionId,
                      success: true, 
                      subscription: subscription 
                  };

              } catch (error) {
                  console.log(`Error pausing subscription ${order.subscriptionId}:`, error.message);
                  return { 
                      orderId: order._id, 
                      subscriptionId: order.subscriptionId,
                      success: false, 
                      error: error.message 
                  };
              }
          });

        
          const results = await Promise.all(pausePromises);

        
          const successful = results.filter(result => result.success);
          const failed = results.filter(result => !result.success);

          await userModel.findByIdAndUpdate(req.user._id,{
              $set:{
                  billingPaused:true
              }
          })
  
          return res.status(200).json({
              message: "Billing pause operation completed",
              totalOrders: orders.length,
              successful: successful.length,
              failed: failed.length,
              results: {
                  successful: successful,
                  failed: failed
              }
          });

      } catch (e) {
          console.log("Pause billing error:", e.message);
          return res.status(500).json({
              error: "Facing issue while pausing billing please try again",
              details: e.message
          });
      }
  }





  module.exports.resumeBilling = async (req, res) => {
      try {
          const stripe = require('stripe')(process.env.STRIPE_LIVE);
      
          let orders = await orderModel.find({
              status: 'paused'
          });
      
          orders=orders?.filter(u=>u?.user?.toString()==req?.user?._id?.toString())

          if (orders.length === 0) {
              return res.status(400).json({
                  error: "No paused subscriptions found to resume"
              });
          }

          const resumePromises = orders.map(async (order) => {
              try {
                  if (!order.subscriptionId) {
                      return { orderId: order._id, success: false, error: 'No subscription ID' };
                  }

                  const subscription = await stripe.subscriptions.update(
                    order.subscriptionId,
                    {
                      pause_collection: '',
                    },
                    {
                      idempotencyKey: `resume-${order.subscriptionId}-${Date.now()}`
                    }
                  );

                  
                  await orderModel.findByIdAndUpdate(order._id, {
                      status: 'confirmed',
                      resumedAt: new Date(),
                      $unset: { pausedAt: 1 } 
                  });

                  await userModel.findByIdAndUpdate(req.user._id,{
                      $set:{
                          billingPaused:false
                      }
                  })
                  return { 
                      orderId: order._id, 
                      subscriptionId: order.subscriptionId,
                      success: true, 
                      subscription: subscription 
                  };

              } catch (error) {
                  console.log(`Error resuming subscription ${order.subscriptionId}:`, error.message);
                  return { 
                      orderId: order._id, 
                      subscriptionId: order.subscriptionId,
                      success: false, 
                      error: error.message 
                  };
              }
          });

          const results = await Promise.all(resumePromises);
          const successful = results.filter(result => result.success);
          const failed = results.filter(result => !result.success);

          return res.status(200).json({
              message: "Billing resume operation completed",
              totalOrders: orders.length,
              successful: successful.length,
              failed: failed.length,
              results: {
                  successful: successful,
                  failed: failed
              }
          });

      } catch (e) {
          console.log("Resume billing error:", e.message);
          return res.status(500).json({
              error: "Facing issue while resuming billing please try again",
              details: e.message
          });
      }
  }





  module.exports.handleStripeConnectWebhook = async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    const endpointSecret = "whsec_1QTQ8XtkP0rFEVQbyWj282ebsc1WArsZ";
    // const endpointSecret = "whsec_b82d718fbae44ab38035f9ce59915a1c5c7870d001c5d90f38cab27b8e52a15c";
    const sig = req.headers['stripe-signature'];

    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log('✅ Webhook received:', event.type);
    
    try {
      switch (event.type) {
        case 'account.updated':
    
          await handleAccountUpdated(event.data.object, stripe);
          break;

          case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object, stripe);
            break;

        case 'account.external_account.created':
          await handleExternalAccountCreated(event.data.object, stripe);
          break;
        
        case 'capability.updated':
          await handleCapabilityUpdated(event.data.object, stripe);
          break;
        
        case 'account.application.authorized':
          await handleAccountAuthorized(event.data.object, stripe);
          break;
        
      
        
          case 'payout.failed':
            await handlePayoutFailed(event.data.object, stripe);
            break;

            case 'invoice.payment_succeeded':
              await handleSubscriptionPaymentSucceeded(event.data.object, stripe);
              break;
            
              case 'invoice.payment_failed':
                await handleSubscriptionPaymentFailed(event.data.object, stripe);
                break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.json({ received: true });
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  };



  async function handleSubscriptionDeleted(subscription, stripe) {
    console.log('🗑️ Subscription deleted:', subscription.id);
    
    const order = await orderModel.findOne({ subscriptionId: subscription.id });
    
    if (order) {
      await orderModel.findByIdAndUpdate(order._id, {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      });
      
      console.log(`❌ Order ${order._id} marked as CANCELLED`);
    }
  }

  // Updated handleAccountUpdated function - recognizes when banking is complete

  async function handleAccountUpdated(accountFromWebhook, stripe) {
    console.log('='.repeat(60));
    console.log('📝 ACCOUNT.UPDATED WEBHOOK RECEIVED');
    console.log('='.repeat(60));
    console.log('Account ID from webhook:', accountFromWebhook.id);
    console.log('Webhook data keys:', Object.keys(accountFromWebhook));
    
    try {
      // Try to find vendor
      console.log('🔍 Searching for vendor with stripe_account_id:', accountFromWebhook.id);
      const vendor = await Vendor.findOne({ stripe_account_id: accountFromWebhook.id });
      
      if (!vendor) {
        console.log('❌ NO VENDOR FOUND for account:', accountFromWebhook.id);
        console.log('Checking all vendors in DB...');
        const allVendors = await Vendor.find({}, 'email stripe_account_id name');
        console.log('All vendors:', allVendors);
        return;
      }
      
      console.log('✅ VENDOR FOUND:');
      console.log('   Vendor ID:', vendor._id);
      console.log('   Vendor email:', vendor.email);
      console.log('   Vendor name:', vendor.name);
      console.log('   Current stripe_connect_status:', vendor.stripe_connect_status);
      console.log('   Current stripeAccountData:', vendor.stripeAccountData);
      
      console.log('🔄 Fetching fresh account data from Stripe API...');
      const account = await stripe.accounts.retrieve(accountFromWebhook.id);
      
      console.log('📊 FRESH ACCOUNT DATA:');
      console.log('   charges_enabled:', account.charges_enabled);
      console.log('   payouts_enabled:', account.payouts_enabled);
      console.log('   details_submitted:', account.details_submitted);
      console.log('   transfers_capability:', account.capabilities?.transfers);
      console.log('   country:', account.country);
      console.log('   default_currency:', account.default_currency);
      console.log('   external_accounts count:', account.external_accounts?.data?.length || 0);
      
      if (account.external_accounts?.data?.length > 0) {
        console.log('   🏦 External accounts:');
        account.external_accounts.data.forEach((acc, i) => {
          console.log(`      ${i + 1}. ${acc.object} - Last4: ${acc.last4} - Status: ${acc.status}`);
        });
      }
      
      const currentlyDue = account.requirements?.currently_due || [];
      const eventuallyDue = account.requirements?.eventually_due || [];
      
      console.log('📋 REQUIREMENTS:');
      console.log('   Currently due:', currentlyDue);
      console.log('   Eventually due:', eventuallyDue);
      
      const criticalRequirements = ['external_account', 'tos_acceptance.date', 'tos_acceptance.ip'];
      const hasCriticalRequirements = criticalRequirements.some(req => currentlyDue.includes(req));
      const bankingComplete = !hasCriticalRequirements;
      
      const isFullyOnboarded =
        account.details_submitted === true &&
        account.payouts_enabled === true &&
        currentlyDue.length === 0;
      
      console.log('✅ COMPUTED STATUS:');
      console.log('   hasCriticalRequirements:', hasCriticalRequirements);
      console.log('   bankingComplete:', bankingComplete);
      console.log('   isFullyOnboarded:', isFullyOnboarded);
      
      const updateData = {
        stripe_account_id: account.id,
        stripeAccountData: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          transfersCapability: account.capabilities?.transfers,
          country: account.country,
          defaultCurrency: account.default_currency,
          currentlyDue: currentlyDue,
          eventuallyDue: eventuallyDue,
          hasBankAccount: account.external_accounts?.data?.length > 0,
          bankingComplete: bankingComplete,
          fullyOnboarded: isFullyOnboarded,
          lastUpdated: new Date()
        }
      };
  
      if (bankingComplete) {
        updateData.stripe_connect_status = true;
        console.log('🎉 Will set stripe_connect_status to TRUE');
      } else {
        updateData.stripe_connect_status = false;
        console.log('⏳ Will set stripe_connect_status to FALSE');
      }
      
      console.log('💾 UPDATE DATA TO BE SAVED:');
      console.log(JSON.stringify(updateData, null, 2));
      
      console.log('🔄 Attempting database update...');
      const updatedVendor = await Vendor.findOneAndUpdate(
        { stripe_account_id: account.id },
        { $set: updateData },
        { new: true }
      );
      
      if (!updatedVendor) {
        console.log('❌ UPDATE FAILED - No vendor returned from findOneAndUpdate');
        return;
      }
      
      console.log('✅ DATABASE UPDATE SUCCESSFUL:');
      console.log('   stripe_connect_status:', updatedVendor.stripe_connect_status);
      console.log('   stripeAccountData.bankingComplete:', updatedVendor.stripeAccountData?.bankingComplete);
      console.log('   stripeAccountData.hasBankAccount:', updatedVendor.stripeAccountData?.hasBankAccount);
      console.log('   stripeAccountData.payoutsEnabled:', updatedVendor.stripeAccountData?.payoutsEnabled);
      console.log('   Full stripeAccountData:', updatedVendor.stripeAccountData);
      
      const wasNotComplete = !vendor.stripeAccountData?.bankingComplete;
      
      if (bankingComplete && wasNotComplete) {
        console.log('✅✅✅ BANKING SETUP COMPLETE - SENDING EMAIL ✅✅✅');
        await sendBankingSuccessEmail(vendor, account);
      } else if (!bankingComplete) {
        console.log('⏳ VENDOR ONBOARDING INCOMPLETE');
        console.log('Missing requirements:', currentlyDue.filter(req => criticalRequirements.includes(req)));
      } else {
        console.log('ℹ️ Status unchanged - banking already complete');
      }
      
      console.log('='.repeat(60));
      console.log('END OF ACCOUNT.UPDATED HANDLER');
      console.log('='.repeat(60));
      
    } catch (error) {
      console.error('❌ ERROR in handleAccountUpdated:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
  // Also handle when external account is explicitly created
 



  async function handleCapabilityUpdated(capability, stripe) {
    console.log('⚡ Capability updated:', capability.id, 'Status:', capability.status);
    
    try {
      const vendor = await Vendor.findOne({ 
        stripe_account_id: capability.account 
      });
      
      if (vendor) {
        await Vendor.findByIdAndUpdate(vendor._id, {
          $set: {
            [`stripeAccountData.${capability.id}Capability`]: capability.status
          }
        });
        
        if (capability.id === 'transfers' && capability.status === 'active') {
          console.log('✅ TRANSFERS CAPABILITY ACTIVE for vendor:', vendor._id);
          
          
          console.log('🔄 Fetching full account data after transfers activated...');
          const account = await stripe.accounts.retrieve(capability.account);
          
          const isFullyOnboarded = account.charges_enabled && 
                                  account.payouts_enabled &&
                                  account.details_submitted &&
                                  account.capabilities?.transfers === 'active';
          
          await Vendor.findByIdAndUpdate(vendor._id, {
            $set: {
              stripe_connect_status: isFullyOnboarded,
              stripeAccountData: {
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                transfersCapability: account.capabilities?.transfers,
                country: account.country,
                defaultCurrency: account.default_currency,
                currentlyDue: account.requirements?.currently_due || [],
                eventuallyDue: account.requirements?.eventually_due || [],
                lastUpdated: new Date()
              }
            }
          });
          
          console.log('✅ Full account status updated. Onboarded:', isFullyOnboarded);
        }
      }
    } catch (error) {
      console.error('Error handling capability.updated:', error);
    }
  }

  async function handleAccountAuthorized(application, stripe) {
    console.log('✅ Account authorized:', application.account);
    
    try {
      const vendor = await Vendor.findOne({ 
        stripe_account_id: application.account 
      });
      
      if (vendor) {
        await Vendor.findByIdAndUpdate(vendor._id, {
          $set: {
            'stripeAccountData.applicationStatus': 'authorized'
          }
        });
        console.log('✅ Application authorized for vendor:', vendor._id);
        

        console.log('🔄 Fetching full account data after authorization...');
        const account = await stripe.accounts.retrieve(application.account);
        
        const isFullyOnboarded = account.charges_enabled && 
                                account.payouts_enabled &&
                                account.details_submitted &&
                                account.capabilities?.transfers === 'active';
        
        await Vendor.findByIdAndUpdate(vendor._id, {
          $set: {
            stripe_connect_status: isFullyOnboarded,
            stripeAccountData: {
              chargesEnabled: account.charges_enabled,
              payoutsEnabled: account.payouts_enabled,
              detailsSubmitted: account.details_submitted,
              transfersCapability: account.capabilities?.transfers,
              country: account.country,
              defaultCurrency: account.default_currency,
              currentlyDue: account.requirements?.currently_due || [],
              eventuallyDue: account.requirements?.eventually_due || [],
              lastUpdated: new Date()
            }
          }
        });
        
        console.log('✅ Full account status updated. Onboarded:', isFullyOnboarded);
      }
    } catch (error) {
      console.error('Error handling account.application.authorized:', error);
    }
  }


  async function handleExternalAccountCreated(externalAccount, stripe) {
    console.log('🏦 External account created:', externalAccount.id);
    
    try {
      const vendor = await Vendor.findOne({ 
        stripe_account_id: externalAccount.account 
      });
      
      if (!vendor) {
        console.log('⚠️ No vendor found for account:', externalAccount.account);
        return;
      }
      
      console.log('✅ Bank account added for vendor:', vendor._id);
      
      // Fetch full account data
      const account = await stripe.accounts.retrieve(externalAccount.account);
      const currentlyDue = account.requirements?.currently_due || [];
      const criticalRequirements = ['external_account', 'tos_acceptance.date', 'tos_acceptance.ip'];
      const hasCriticalRequirements = criticalRequirements.some(req => currentlyDue.includes(req));
      const bankingComplete = !hasCriticalRequirements;
      
      console.log('🔍 After bank account added:');
      console.log('   Currently due:', currentlyDue);
      console.log('   Banking complete:', bankingComplete);
      console.log('   Vendor before update:', vendor.stripe_connect_status);
      
      const updateData = {
        'stripeAccountData.hasBankAccount': true,
        'stripeAccountData.bankAccountLast4': externalAccount.last4,
        'stripeAccountData.bankAccountStatus': externalAccount.status,
        'stripeAccountData.bankingComplete': bankingComplete,
        'stripeAccountData.currentlyDue': currentlyDue,
        'stripeAccountData.chargesEnabled': account.charges_enabled,
        'stripeAccountData.payoutsEnabled': account.payouts_enabled,
        'stripeAccountData.detailsSubmitted': account.details_submitted,
        'stripeAccountData.transfersCapability': account.capabilities?.transfers,
        'stripeAccountData.lastUpdated': new Date()
      };
      
      // Set stripe_connect_status if banking is complete
      if (bankingComplete) {
        updateData.stripe_connect_status = true;
        console.log('✅ Setting stripe_connect_status to TRUE via external_account.created');
      }
      
      const updatedVendor = await Vendor.findByIdAndUpdate(
        vendor._id, 
        { $set: updateData },
        { new: true } // Return updated document
      );
      
      console.log('💾 Vendor updated. stripe_connect_status:', updatedVendor.stripe_connect_status);
      console.log('💾 Banking complete:', updatedVendor.stripeAccountData?.bankingComplete);
      
      if (bankingComplete) {
        await sendBankingSuccessEmail(vendor, account);
      }
      
    } catch (error) {
      console.error('❌ Error handling external_account.created:', error);
      throw error;
    }
  }

  // async function handleExternalAccountCreated(externalAccount, stripe) {
  //   console.log('🏦 External account created:', externalAccount.id);
    
  //   try {
  //     const vendor = await Vendor.findOne({ 
  //       stripe_account_id: externalAccount.account 
  //     });
      
  //     if (!vendor) {
  //       console.log('⚠️ No vendor found for external account');
  //       return;
  //     }
      
  //     console.log('✅ Bank account added for vendor:', vendor._id);
      
  //     const account = await stripe.accounts.retrieve(externalAccount.account);
  //     const currentlyDue = account.requirements?.currently_due || [];
  //     const criticalRequirements = ['external_account', 'tos_acceptance.date', 'tos_acceptance.ip'];
  //     const hasCriticalRequirements = criticalRequirements.some(req => currentlyDue.includes(req));
  //     const bankingComplete = !hasCriticalRequirements;
      
  //     const updateData = {
  //       'stripeAccountData.hasBankAccount': true,
  //       'stripeAccountData.bankAccountLast4': externalAccount.last4,
  //       'stripeAccountData.bankAccountStatus': externalAccount.status,
  //       'stripeAccountData.bankingComplete': bankingComplete,
  //       'stripeAccountData.currentlyDue': currentlyDue
  //     };
      
  //     if (bankingComplete) {
  //       updateData.stripe_connect_status = true;
  //       console.log('✅ Setting stripe_connect_status to TRUE');
  //     }
      
  //     await Vendor.findByIdAndUpdate(vendor._id, { $set: updateData });
      
  //     if (bankingComplete) {
  //       await sendBankingSuccessEmail(vendor, account);
  //     }
      
  //   } catch (error) {
  //     console.error('❌ Error handling external_account.created:', error.message);
  //     throw error;
  //   }
  // }
    /**
     * Handle capability.updated event
     * Transfers capability is what allows receiving payments
     */
  
    /**
     * Handle account.application.authorized event
     * Account successfully connected
     */
   
    


    



    async function sendBankingSuccessEmail(vendor, account) {
      try {
    
        const mailOptions = {
          from: 'orders@enrichifydata.com',
          to: vendor.email,
          subject: 'Banking Setup Complete - Ready to Receive Payments! - RentSimple',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background-color: #28a745; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Banking Setup Complete!</h1>
                <p style="color: #d4edda; margin-top: 10px; font-size: 16px;">You're ready to receive payments</p>
              </div>
              
              <!-- Success Time -->
              <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Activated On</p>
                <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date().toLocaleString('en-US', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}</h2>
              </div>
    
              <!-- Main Content -->
              <div style="padding: 30px;">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
                  Congratulations!
                </h3>
                
                <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                  Hello <strong>${vendor.name || vendor.username}</strong>,
                </p>
                
                <p style="color: #495057; font-size: 16px; line-height: 1.6;">
                  Great news! Your Stripe banking setup is now complete and verified. You can now receive payments from renters directly to your bank account.
                </p>
    
                <!-- Success Banner -->
                <div style="margin-top: 30px; padding: 25px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px; text-align: center;">
                  <h2 style="margin: 0; color: #155724; font-size: 24px;">✅ All Systems Ready</h2>
                  <p style="margin: 10px 0 0 0; color: #155724; font-size: 16px;">Your account is fully set up to receive payments</p>
                </div>
    
                <!-- Account Status -->
                <div style="margin-top: 30px;">
                  <h4 style="color: #2c3e50; margin-bottom: 15px;">Your Account Status:</h4>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; width: 50%;">Account Status</td>
                      <td style="padding: 12px; border: 1px solid #dee2e6;">
                        <span style="background-color: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">ACTIVE</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Payouts Enabled</td>
                      <td style="padding: 12px; border: 1px solid #dee2e6;">
                        <span style="color: #28a745; font-weight: 600;">✅ Yes</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Transfers Capability</td>
                      <td style="padding: 12px; border: 1px solid #dee2e6;">
                        <span style="color: #28a745; font-weight: 600;">✅ Active</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Country</td>
                      <td style="padding: 12px; border: 1px solid #dee2e6;">${account.country || 'US'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Currency</td>
                      <td style="padding: 12px; border: 1px solid #dee2e6;">${(account.default_currency || 'usd').toUpperCase()}</td>
                    </tr>
                  </table>
                </div>
    
                <!-- What's Next -->
                <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">📌 What's Next?</h4>
                  <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460; line-height: 1.8;">
                    <li>Start listing your appliances for rent</li>
                    <li>Approve rental requests from customers</li>
                    <li>Receive payments directly to your bank account</li>
                    <li>Track your earnings in the vendor dashboard</li>
                  </ul>
                </div>
    
                <!-- Payment Timeline -->
                <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">💰 Payment Information</h4>
                  <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                    When a rental is confirmed, payments will be automatically transferred to your connected bank account. Funds typically arrive within 2-7 business days.
                  </p>
                </div>
    
                <!-- Call to Action Button -->
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                    style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Go to Dashboard
                  </a>
                </div>
    
                <!-- Support Info -->
                <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    If you have any questions about receiving payments or managing your account, our support team is ready to assist you.
                  </p>
                </div>
    
                <!-- Account ID -->
                <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px;">Stripe Account ID: <strong>${account.id}</strong></p>
                </div>
              </div>
    
              <!-- Footer -->
              <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                  This is an automated notification from RentSimple.
                </p>
                <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                  © 2025 RentSimple. All rights reserved.
                </p>
              </div>
            </div>
          `
        };
    
        await transporter.sendMail(mailOptions);
        console.log('📧 Banking success email sent to:', vendor.email);
      } catch (error) {
        console.error('Error sending banking success email:', error);
      }
    }



    async function handleSubscriptionPaymentSucceeded(invoice, stripe) {
      console.log('💰 Subscription payment succeeded:', invoice.id);
      
      try {
        const order = await orderModel.findOne({ subscriptionId: invoice.subscription })
          .populate('vendor')
          .populate('user')
          .populate('listing');
        
        if (!order || !order.vendor) {
          console.log('⚠️ No order or vendor found for subscription:', invoice.subscription);
          return;
        }
    
        const vendor = order.vendor;
        const isRecurringPayment = invoice.billing_reason === 'subscription_cycle';
        
        console.log('📋 Payment info:', {
          billingReason: invoice.billing_reason,
          isRecurring: isRecurringPayment,
          transferStatus: order.transferStatus
        });
    
        // ============================================
        // AUTO-RELEASE FOR RECURRING PAYMENTS (Month 2+)
        // ============================================
        if (isRecurringPayment && order.transferStatus === 'completed') {
          console.log('🔄 Recurring payment - auto-releasing to vendor');
          
          const invoiceTotalCents = invoice.amount_paid;
          const platformFeeCents = Math.round(invoiceTotalCents * 0.20);
          const vendorPayoutCents = invoiceTotalCents - platformFeeCents;
          
          console.log('💵 Split:', {
            total: invoiceTotalCents / 100,
            platformFee: platformFeeCents / 100,
            vendorPayout: vendorPayoutCents / 100
          });
          
          try {
            const transfer = await stripe.transfers.create({
              amount: vendorPayoutCents,
              currency: 'usd',
              destination: vendor.stripe_account_id,
              description: `Recurring rental - ${order.listing?.title || 'Rental'}`,
              metadata: {
                orderId: order._id.toString(),
                invoiceId: invoice.id,
                subscriptionId: invoice.subscription,
                payment_type: 'recurring',
                period_start: invoice.period_start,
                period_end: invoice.period_end
              }
            }, {
              idempotencyKey: `transfer-${order._id.toString()}-${invoice.id}`
            });
            
            console.log('✅ Auto-transfer successful:', transfer.id);
            
            await orderModel.findByIdAndUpdate(order._id, {
              $set: {
                status: 'confirmed',
                paymentStatus: 'paid'
              }
            });
            
            // Send email about successful transfer
            const transporter = nodemailer.createTransporter({
              service: 'gmail',
              auth: {
                user: 'rentsimple159@gmail.com', 
                pass: 'mlgioecamzoitfdt' 
              }
            });
            
            await transporter.sendMail({
              from: 'orders@enrichifydata.com',
              to: vendor.email,
              subject: 'Monthly Rental Payment Released - RentSimple',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #28a745; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0;">💰 Payment Released!</h1>
                    <p style="color: #d4edda; margin-top: 10px;">Recurring rental payment automatically transferred</p>
                  </div>
                  <div style="padding: 30px;">
                    <p>Hello ${vendor.name || vendor.username},</p>
                    <p>Your recurring rental payment has been automatically released to your account.</p>
                    <div style="background-color: #d4edda; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                      <h2 style="color: #28a745; margin: 0; font-size: 36px;">$${(vendorPayoutCents / 100).toFixed(2)}</h2>
                      <p style="margin: 5px 0 0 0; color: #155724; font-size: 14px;">Transferred to your bank account</p>
                    </div>
                    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Transfer ID:</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; font-family: monospace; font-size: 12px;">${transfer.id}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Product:</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">${order.listing?.title || 'Rental'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Customer:</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">${order.user?.name || order.user?.email || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Billing Period:</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                          ${new Date(invoice.period_start * 1000).toLocaleDateString()} - ${new Date(invoice.period_end * 1000).toLocaleDateString()}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Total Collected:</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">$${(invoiceTotalCents / 100).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600;">Platform Fee (20%):</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545;">-$${(platformFeeCents / 100).toFixed(2)}</td>
                      </tr>
                      <tr style="border-top: 2px solid #28a745;">
                        <td style="padding: 12px; background-color: #e7f3f2; font-weight: 700;">Your Payout:</td>
                        <td style="padding: 12px; background-color: #e7f3f2; color: #28a745; font-weight: 700; font-size: 18px;">$${(vendorPayoutCents / 100).toFixed(2)}</td>
                      </tr>
                    </table>
                    <div style="background-color: #d1ecf1; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #0c5460;">
                        <strong>💸 Automatic Transfers:</strong> Your monthly rental payments will continue to be automatically transferred to your bank account within minutes of collection.
                      </p>
                    </div>
                    <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #856404;">
                        <strong>⏱️ Arrival Time:</strong> Funds typically arrive in your bank account within 2-7 business days.
                      </p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                        style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        View Dashboard
                      </a>
                    </div>
                  </div>
                  <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #ecf0f1; font-size: 12px;">© 2025 RentSimple. All rights reserved.</p>
                  </div>
                </div>
              `
            });
            
            console.log('📧 Recurring payment email sent');
            return;
            
          } catch (transferError) {
            console.error('❌ Auto-transfer failed:', transferError);
            // Transfer failed - order stays in current status, admin can manually release
          }
        }
        
        // ============================================
        // FIRST PAYMENT - Just update status
        // ============================================
        await orderModel.findByIdAndUpdate(order._id, {
          $set: {
            status: 'processing',
            paymentStatus: 'paid'
          }
        });
        
        // Send original email for first payment
        const mailOptions = {
          from: 'orders@enrichifydata.com',
          to: vendor.email,
          subject: 'Monthly Rental Payment Received - RentSimple',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background-color: #28a745; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💰 Payment Received!</h1>
                <p style="color: #d4edda; margin-top: 10px; font-size: 16px;">Monthly rental payment processed successfully</p>
              </div>
              
              <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Payment Date</p>
                <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date(invoice.created * 1000).toLocaleString('en-US', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}</h2>
              </div>
    
              <div style="padding: 30px;">
                <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
                  <p style="margin: 0; color: #155724; font-size: 16px; font-weight: 600;">Payment Amount</p>
                  <h1 style="margin: 10px 0 0 0; color: #28a745; font-size: 42px; font-weight: 700;">$${(invoice.amount_paid / 100).toFixed(2)}</h1>
                </div>
    
                <h3 style="color: #2c3e50; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
                  Payment Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Invoice ID</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">${invoice.id}</td>
                  </tr>
                  ${order.listing ? `
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Product</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.listing.title}</td>
                  </tr>
                  ` : ''}
                  ${order.user ? `
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Customer</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.user.name || order.user.email}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Amount Paid</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745; font-weight: 700; font-size: 18px;">$${(invoice.amount_paid / 100).toFixed(2)}</td>
                  </tr>
                </table>
    
                <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💸 Payout Information</h4>
                  <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                    Your payout will be processed and transferred to your bank account within 2-7 business days after delivery confirmation.
                  </p>
                </div>
              </div>
    
              <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #ecf0f1; font-size: 12px;">© 2025 RentSimple. All rights reserved.</p>
              </div>
            </div>
          `
        };
    
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: 'rentsimple159@gmail.com', 
            pass: 'mlgioecamzoitfdt' 
          }
        });
    
        await transporter.sendMail(mailOptions);
        console.log('📧 Payment notification sent');
        
      } catch (error) {
        console.error('Error handling subscription payment succeeded:', error);
      }
    }

    async function handleSubscriptionPaymentFailed(invoice, stripe) {
      console.log('❌ Subscription payment failed:', invoice.id);
      
      try {
        // Find the order/request associated with this subscription
        const order = await orderModel.findOne({ subscriptionId: invoice.subscription })
          .populate('vendor')
          .populate('user')
          .populate('listing');
        
        if (!order || !order.vendor) {
          console.log('⚠️ No order or vendor found for subscription:', invoice.subscription);
          return;
        }
        
        await orderModel.findByIdAndUpdate(order._id, {
          $set: {
            status: 'PAST_DUE',
            paymentStatus: 'failed'
          }
        });
        const vendor = order.vendor;
        
        const mailOptions = {
          from: 'orders@enrichifydata.com',
          to: vendor.email,
          subject: 'Payment Failed - Action May Be Required - RentSimple',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background-color: #dc3545; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Payment Failed</h1>
                <p style="color: #f8d7da; margin-top: 10px; font-size: 16px;">Monthly rental payment unsuccessful</p>
              </div>
              
              <!-- Alert Time -->
              <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Failed On</p>
                <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date(invoice.created * 1000).toLocaleString('en-US', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}</h2>
              </div>
    
              <!-- Main Content -->
              <div style="padding: 30px;">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #dc3545; padding-bottom: 10px; margin-top: 0;">
                  Payment Attempt Failed
                </h3>
                
                <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                  Hello <strong>${vendor.name || vendor.username}</strong>,
                </p>
                
                <p style="color: #495057; font-size: 16px; line-height: 1.6;">
                  We're writing to inform you that a monthly rental payment from your customer has failed. The customer has been notified and Stripe will automatically retry the payment.
                </p>
    
                <!-- Failed Payment Details -->
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Invoice ID</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">${invoice.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Subscription ID</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">${invoice.subscription}</td>
                  </tr>
                  ${order.listing ? `
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Product</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.listing.title}</td>
                  </tr>
                  ` : ''}
                  ${order.user ? `
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Customer</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${order.user.name || order.user.email}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Attempted Amount</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545; font-weight: 700; font-size: 18px;">$${(invoice.amount_due / 100).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Attempt Count</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${invoice.attempt_count || 1}</td>
                  </tr>
                </table>
    
                <!-- What Happens Next -->
                <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">📌 What Happens Next?</h4>
                  <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460; line-height: 1.8;">
                    <li>Stripe will automatically retry the payment</li>
                    <li>The customer has been notified to update their payment method</li>
                    <li>You'll receive an update once payment is successful</li>
                    <li>If payment continues to fail, you may need to contact the customer</li>
                  </ul>
                </div>
    
                <!-- Important Notice -->
                <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">⚠️ Action May Be Required</h4>
                  <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                    If the payment continues to fail after multiple attempts, you may need to contact your customer directly or consider pausing the rental agreement.
                  </p>
                </div>
    
                <!-- Call to Action Button -->
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                    style="display: inline-block; background-color: #024a47; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View Order Details
                  </a>
                </div>
    
                <!-- Support Info -->
                <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    If you need assistance managing this situation or have questions, please contact our support team.
                  </p>
                </div>
              </div>
    
              <!-- Footer -->
              <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                  This is an automated notification from RentSimple.
                </p>
                <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                  © 2025 RentSimple. All rights reserved.
                </p>
              </div>
            </div>
          `
        };
    
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'rentsimple159@gmail.com', 
            pass: 'mlgioecamzoitfdt' 
          }
        });
    
        await transporter.sendMail(mailOptions);
        console.log('📧 Subscription payment failed email sent to:', vendor.email);
        
      } catch (error) {
        console.error('Error handling subscription payment failed:', error);
      }
    }

    
    async function handlePayoutFailed(payout, stripe) {
      console.log('❌ Payout failed:', payout.id);
      
      try {
        // Get the account this payout belongs to
        const vendor = await Vendor.findOne({ stripe_account_id: payout.destination });
        
        if (!vendor) {
          console.log('⚠️ No vendor found for payout:', payout.id);
          return;
        }
        
        const mailOptions = {
          from: 'orders@enrichifydata.com',
          to: vendor.email,
          subject: 'Urgent: Payout Failed - Update Banking Information - RentSimple',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background-color: #dc3545; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚨 Payout Failed</h1>
                <p style="color: #f8d7da; margin-top: 10px; font-size: 16px;">Action required to receive your payments</p>
              </div>
              
              <!-- Alert Time -->
              <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Failed On</p>
                <h2 style="margin: 5px 0 0 0; color: #2c3e50; font-size: 20px;">${new Date(payout.created * 1000).toLocaleString('en-US', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}</h2>
              </div>
    
              <!-- Main Content -->
              <div style="padding: 30px;">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #dc3545; padding-bottom: 10px; margin-top: 0;">
                  Payout Transfer Failed
                </h3>
                
                <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                  Hello <strong>${vendor.name || vendor.username}</strong>,
                </p>
                
                <p style="color: #495057; font-size: 16px; line-height: 1.6;">
                  Unfortunately, we were unable to transfer a payout to your bank account. This usually happens due to outdated or incorrect banking information.
                </p>
    
                <!-- Failed Payout Details -->
                <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; border-radius: 4px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #721c24; font-size: 18px;">Failed Payout Amount</h4>
                  <h1 style="margin: 0; color: #dc3545; font-size: 36px; font-weight: 700;">$${(payout.amount / 100).toFixed(2)}</h1>
                </div>
    
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; width: 40%; font-weight: 600; color: #2c3e50;">Payout ID</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057; font-family: monospace;">${payout.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Status</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">
                      <span style="background-color: #dc3545; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">FAILED</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Failure Code</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${payout.failure_code || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Failure Message</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #495057;">${payout.failure_message || 'Bank account information may be invalid or outdated'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #2c3e50;">Amount</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545; font-weight: 700; font-size: 18px;">$${(payout.amount / 100).toFixed(2)}</td>
                  </tr>
                </table>
    
                <!-- Common Reasons -->
                <div style="margin-top: 30px;">
                  <h4 style="color: #2c3e50; margin-bottom: 15px;">Common Reasons for Payout Failures:</h4>
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
                      <li>Incorrect bank account or routing number</li>
                      <li>Bank account closed or frozen</li>
                      <li>Bank doesn't accept ACH transfers</li>
                      <li>Account holder name mismatch</li>
                      <li>Outdated banking information</li>
                    </ul>
                  </div>
                </div>
    
                <!-- Urgent Action Required -->
                <div style="margin-top: 30px; padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #721c24; font-size: 16px;">🚨 Immediate Action Required</h4>
                  <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.6;">
                    You must update your banking information in Stripe immediately to receive this payout and future payments. Your funds are safe but cannot be transferred until your banking details are correct.
                  </p>
                </div>
    
                <!-- Call to Action Button -->
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'https://rentsimpledeals.com'}/vendordashboard" 
                    style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Update Banking Information
                  </a>
                </div>
    
                <!-- What Happens to Your Money -->
                <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; border-radius: 4px;">
                  <h4 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">💰 What Happens to Your Money?</h4>
                  <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                    Your funds remain secure in your Stripe account. Once you update your banking information, the payout will be automatically retried and transferred to your updated account.
                  </p>
                </div>
    
                <!-- Support Info -->
                <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Need Help?</h4>
                  <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                    If you're having trouble updating your banking information or have questions about this failed payout, please contact our support team immediately. We're here to help ensure you receive your payments.
                  </p>
                </div>
    
                <!-- Payout Reference -->
                <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px; text-align: center;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px;">Payout Reference: <strong>${payout.id}</strong></p>
                </div>
              </div>
    
              <!-- Footer -->
              <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #ecf0f1; font-size: 12px;">
                  This is an automated notification from RentSimple.
                </p>
                <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 11px;">
                  © 2025 RentSimple. All rights reserved.
                </p>
              </div>
            </div>
          `
        };
    
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'rentsimple159@gmail.com', 
            pass: 'mlgioecamzoitfdt' 
          }
        });
    
        await transporter.sendMail(mailOptions);
      }catch(e){


      }
    }  