const Boost = require('../models/boost');
const Listing=require('../models/listing')
const userModel = require('../models/user')

module.exports.getUserListenings = async(req, res) => {
    try {
        let id = req?.user?._id ? req?.user?._id : req.user.id;
        
        let listenings = await Listing.find({status: {$eq: 'active'}})
            .populate('vendor');
        
        const Boost = require('../models/boost');
        const now = new Date();
        
        // Get only active boosts that haven't reached their limit
        const activeBoosts = await Boost.find({
            status: 'active',
            endDate: { $gt: now },
            isReachComplete: false
        });
        
        const listingBoostsMap = new Map();
        activeBoosts.forEach(boost => {
            const listingId = boost.listing.toString();
            if (!listingBoostsMap.has(listingId)) {
                listingBoostsMap.set(listingId, []);
            }
            listingBoostsMap.get(listingId).push(boost);
        });
        
        // Clean up listings that show as boosted but have no active boosts
        const cleanupPromises = [];
        for (const listing of listenings) {
            if (listing.visibility.isBoosted && !listingBoostsMap.has(listing._id.toString())) {
                cleanupPromises.push(
                    Listing.findByIdAndUpdate(listing._id, {
                        'visibility.isBoosted': false,
                        'visibility.boostAmount': 0,
                        'visibility.boostEndDate': null,
                        'visibility.est_react': 0
                    })
                );
                // Update the in-memory object too
                listing.visibility.isBoosted = false;
                listing.visibility.boostAmount = 0;
                listing.visibility.boostEndDate = null;
                listing.visibility.est_react = 0;
            }
        }
        await Promise.all(cleanupPromises);
        
        let user = await userModel.findById(id);

        const sortedListenings = listenings.sort((a, b) => {
            const aBoosts = listingBoostsMap.get(a._id.toString()) || [];
            const bBoosts = listingBoostsMap.get(b._id.toString()) || [];
            
            // Sum up all active boost amounts and remaining reach
            const aTotalAmount = aBoosts.reduce((sum, b) => sum + b.amount, 0);
            const bTotalAmount = bBoosts.reduce((sum, b) => sum + b.amount, 0);
            
            const aTotalReachRemaining = aBoosts.reduce((sum, boost) => {
                return sum + Math.max(0, boost.est_reach - boost.currentViews);
            }, 0);
            
            const bTotalReachRemaining = bBoosts.reduce((sum, boost) => {
                return sum + Math.max(0, boost.est_reach - boost.currentViews);
            }, 0);
            
            // Calculate priority: higher amount + more reach remaining = higher priority
            const aPriority = aTotalAmount * (aTotalReachRemaining / Math.max(1, aTotalAmount));
            const bPriority = bTotalAmount * (bTotalReachRemaining / Math.max(1, bTotalAmount));
            
            if (bPriority !== aPriority) {
                return bPriority - aPriority;
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return res.status(200).json({
            listenings: sortedListenings,
            user
        });
    } catch(e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Error occurred while trying to fetch listenings"
        });
    }
}


module.exports.trackListingView = async(req, res) => {
    try {
        const { listingId } = req.params;
        const now = new Date();
        
        // Increment listing views
        await Listing.findByIdAndUpdate(listingId, {
            $inc: { 'engagement.views': 1 }
        });
        
        // Find and increment views for active boosts
        const activeBoosts = await Boost.find({
            listing: listingId,
            status: 'active',
            endDate: { $gt: now },
            isReachComplete: false
        });
        
        // Track if we should turn off boost
        let shouldTurnOffBoost = false;
        
        if (activeBoosts.length > 0) {
            let allJustCompleted = true;
            
            // Increment each boost's views
            for (const boost of activeBoosts) {
                boost.currentViews += 1;
                
                // Check if reach is complete
                if (boost.currentViews >= boost.est_reach) {
                    boost.isReachComplete = true;
                    boost.status = 'completed';
                } else {
                    allJustCompleted = false;
                }
                
                await boost.save();
            }
            
            // If all active boosts just completed, turn off listing boost
            shouldTurnOffBoost = allJustCompleted;
        } else {
            // No active boosts found, check if listing still shows as boosted
            const listing = await Listing.findById(listingId);
            if (listing && listing.visibility.isBoosted) {
                shouldTurnOffBoost = true;
            }
        }
        
        // Turn off boost if needed
        if (shouldTurnOffBoost) {
            await Listing.findByIdAndUpdate(listingId, {
                'visibility.isBoosted': false,
                'visibility.boostAmount': 0,
                'visibility.boostEndDate': null,
                'visibility.est_react': 0
            });
        }
        
        return res.status(200).json({ success: true });
    } catch(e) {
        console.log(e.message);
        return res.status(500).json({ error: "Error incrementing views" });
    }
}
// module.exports.getUserListenings=async(req,res)=>{
//     try{
//         let id=req?.user?._id?req?.user?._id:req.user.id
//         let listenings=await Listing.find({status:{$eq:'active'}}).populate('vendor')
//         let user=await userModel.findById(id)

  
//         const sortedListenings = listenings.sort((a, b) => {
//             const now = new Date();
            
           
//             const aBoostActive = a.visibility?.isBoosted && 
//                                 a.visibility?.boostEndDate && 
//                                 new Date(a.visibility.boostEndDate) > now &&
//                                 (a.engagement?.views || 0) < (a.visibility?.est_react || Infinity);
            
//             const bBoostActive = b.visibility?.isBoosted && 
//                                 b.visibility?.boostEndDate && 
//                                 new Date(b.visibility.boostEndDate) > now &&
//                                 (b.engagement?.views || 0) < (b.visibility?.est_react || Infinity);
            
        
//             const aBoostAmount = aBoostActive ? (a.visibility?.boostAmount || 0) : 0;
//             const bBoostAmount = bBoostActive ? (b.visibility?.boostAmount || 0) : 0;
            
           
//             const aReachRemaining = aBoostActive 
//                 ? 1 - ((a.engagement?.views || 0) / (a.visibility?.est_react || 1))
//                 : 0;
//             const bReachRemaining = bBoostActive 
//                 ? 1 - ((b.engagement?.views || 0) / (b.visibility?.est_react || 1))
//                 : 0;
            
//             const aPriority = aBoostAmount * aReachRemaining;
//             const bPriority = bBoostAmount * bReachRemaining;
            
        
//             if (bPriority !== aPriority) {
//                 return bPriority - aPriority;
//             }
            
           
//             return new Date(b.createdAt) - new Date(a.createdAt);
//         });

//         return res.status(200).json({
//             listenings: sortedListenings,
//             user
//         })
//     }catch(e){
//         console.log(e.message)
//         return res.status(400).json({
//             error:"Error occured while trying to fetch listenings"
//         })
//     }
// }


// module.exports.trackListingView = async (req, res) => {
//     try {
//         const { listingId } = req.params;
//         const userId = req?.user?._id || req.user.id;

//         const listing = await Listing.findById(listingId);
        
//         if (!listing) {
//             return res.status(404).json({ error: 'Listing not found' });
//         }


//         listing.engagement.views = (listing.engagement.views || 0) + 1;
        
      
//         if (listing.visibility?.isBoosted && listing.visibility?.est_react) {
//             if (listing.engagement.views >= listing.visibility.est_react) {
               
//                 listing.visibility.reachCompleted = true;
//             }
//         }

//         await listing.save();

//         return res.status(200).json({
//             success: true,
//             views: listing.engagement.views
//         });

//     } catch (error) {
//         console.error('Track view error:', error);
//         return res.status(500).json({
//             error: 'Failed to track view'
//         });
//     }
// };