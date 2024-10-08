const Property = require("../models/propertyModel.js");
const Review = require("../models/reviewModel.js");
const { uploadOnCloudinary } = require("../utils/cloudinary.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiError } = require("../utils/ApiError.js");

const addProperty = async (req, res) => {
  try {
    const userId = req.userId;

    const {
      firstName,
      lastName,
      ownersContactNumber,
      ownersAlternateContactNumber,
      pincode,
      city,
      locality,
      address,
      spaceType,
      propertyType,
      petsAllowed,
      preference,
      bachelors,
      type,
      bhk,
      floor,
      nearestLandmark,
      typeOfWashroom,
      coolingFacility,
      carParking,
      rent,
      security,
      images,
      squareFeetArea,
      appliances,
      amenities,
      aboutTheProperty,
      comments,
      locationLink,
    } = req.body;

    // Format the boolean fields correctly
    const formattedPetsAllowed = petsAllowed === "true";
    const formattedCarParking = carParking === "true";

    // Convert numeric fields from the request
    const formattedRent = Number(rent);
    const formattedSecurity = Number(security);
    const formattedBhk = Number(bhk);
    const formattedSquareFeetArea = Number(squareFeetArea);

    // Validate that numeric fields are valid numbers
    if (
      isNaN(formattedRent) ||
      isNaN(formattedSecurity) ||
      isNaN(formattedBhk) ||
      isNaN(formattedSquareFeetArea)
    ) {
      return res
        .status(400)
        .json({ message: "Numeric fields must be valid numbers" });
    }

    // Cloudinary file upload logic
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ message: "Image files are required" });
    }

    const imageLocalPaths = req.files.images.map((file) => file.path);
    const uploadPromises = imageLocalPaths.map((path) =>
      uploadOnCloudinary(path)
    );
    const imgResults = await Promise.all(uploadPromises);

    // Handle any failed uploads
    const failedUploads = imgResults.filter((result) => !result);
    if (failedUploads.length > 0) {
      return res.status(400).json({ message: "Failed to upload some images" });
    }

    const imageUrls = imgResults.map((result) => result.url);

    // Create property data object
    const data = {
      userId,
      firstName,
      lastName,
      ownersContactNumber,
      ownersAlternateContactNumber,
      pincode,
      city,
      locality,
      address,
      spaceType,
      propertyType,
      petsAllowed: formattedPetsAllowed,
      preference,
      bachelors,
      type,
      bhk: formattedBhk,
      floor,
      nearestLandmark,
      typeOfWashroom,
      coolingFacility,
      carParking: formattedCarParking,
      rent: formattedRent,
      security: formattedSecurity,
      images: imageUrls, // Changed photos to images
      squareFeetArea: formattedSquareFeetArea,
      appliances,
      amenities,
      aboutTheProperty,
      comments,
      locationLink,
    };

    // Save property to the database
    const property = await Property.create(data);

    if (!property) {
      return res
        .status(500)
        .json({ message: "Something went wrong while creating property" });
    }

    await property.save();
    return res.status(201).json({
      statusCode: 201,
      property,
      msg: "Property registered successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Logic for updating properties
const updateProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;

    if (!propertyId) {
      return res.status(400).json({ message: "Property ID is required" });
    }

    // Find the property by ID
    let property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Find the user associated with this property
    const user = await User.findById(property.userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User associated with this property not found" });
    }

    // Get the fields from the update form
    const {
      ownerName,
      ownersContactNumber,
      ownersAlternateContactNumber,
      locality,
      address,
      spaceType,
      propertyType,
      currentResidenceOfOwner,
      rent,
      concession,
      petsAllowed,
      preference,
      bachelors,
      type,
      bhk,
      floor,
      nearestLandmark,
      typeOfWashroom,
      coolingFacility,
      carParking,
      subscriptionAmount,
      commentByAnalyst,
      locationLink,
    } = req.body;
    console.log(req.body);

    // Update the property fields
    property.ownerName = ownerName ?? property.ownerName;
    property.ownersContactNumber =
      ownersContactNumber ?? property.ownersContactNumber;
    property.ownersAlternateContactNumber =
      ownersAlternateContactNumber ?? property.ownersAlternateContactNumber;
    property.locality = locality ?? property.locality;
    property.address = address ?? property.address;
    property.spaceType = spaceType ?? property.spaceType;
    property.propertyType = propertyType ?? property.propertyType;
    property.currentResidenceOfOwner =
      currentResidenceOfOwner ?? property.currentResidenceOfOwner;
    property.rent = rent ?? property.rent;
    property.concession = concession ?? property.concession;
    property.petsAllowed =
      petsAllowed !== undefined ? petsAllowed : property.petsAllowed;
    property.preference = preference ?? property.preference;
    property.bachelors = bachelors ?? property.bachelors;
    property.type = type ?? property.type;
    property.bhk = bhk ?? property.bhk;
    property.floor = floor ?? property.floor;
    property.nearestLandmark = nearestLandmark ?? property.nearestLandmark;
    property.typeOfWashroom = typeOfWashroom ?? property.typeOfWashroom;
    property.coolingFacility = coolingFacility ?? property.coolingFacility;
    property.carParking =
      carParking !== undefined ? carParking : property.carParking;
    property.subscriptionAmount =
      subscriptionAmount ?? property.subscriptionAmount;
    property.commentByAnalyst = commentByAnalyst ?? property.commentByAnalyst;
    property.locationLink = locationLink ?? property.locationLink;

    // Save the updated property
    const updatedProperty = await property.save();

    console.log(updatedProperty);

    return res.status(200).json({
      statusCode: 200,
      property: updatedProperty,
      message: "Property updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//logic for delete property
const deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;

    if (!propertyId) {
      return res.status(400).json({ message: "Property ID is required" });
    }

    // Find the property by ID
    let property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if the authenticated user is the owner of the property
    const user = await User.findById(property.userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User associated with this property not found" });
    }

    // Check if the user is authorized to delete this property
    // Assuming user ID is available in req.user from the middleware
    const userId = req.user._id;
    if (property.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You do not own this property" });
    }

    // Delete the property
    await Property.findByIdAndDelete(propertyId);

    return res.status(200).json({
      statusCode: 200,
      message: "Property deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
//logic for get all propertys
const GetProperty = async (req, res) => {
  try {
    const data = await Property.find({});
    //  console.log(` data length ${data.length}`)
    if (data.length <= 0) {
      return res.status(404).json({ message: "No Property found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPropertyById = async (req, res) => {
  try {
    const propertyId = req.params.id;

    if (!propertyId) {
      return res.status(400).json({ message: "Property ID is required" });
    }

    const property = await Property.findById(propertyId).populate("reviews");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.status(200).json(property);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPropertyByCity = async (req, res) => {
  try {
    // if (!propertyId) {
    //   return res.status(400).json({ message: "Property ID is required" });
    // }

    const property = await Property.find({ city: req.params.city });

    // const property = await Property.findById(propertyId).populate("reviews");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.status(200).json(property);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getFilteredProperties = async (req, res) => {
  try {
    const {
      bhk,
      residential,
      commercial,
      preferenceHousing,
      genderPreference,
      houseType,
      city,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // Handling BHK filter
    if (bhk) {
      const bhkValues = bhk
        .split(",")
        .map((b) => parseInt(b.replace(/\D/g, "")));
      filter.bhk = { $in: bhkValues };
    }

    // Handling residential filter
    if (residential) {
      const residentialTypes = residential
        .split(",")
        .map((t) => t.replace(/^\+ /, ""));
      filter.propertyType = { $in: residentialTypes };
    }

    // Handling commercial filter
    if (commercial) {
      const commercialTypes = commercial
        .split(",")
        .map((t) => t.replace(/^\+ /, ""));
      filter.propertyType = {
        $in: [...(filter.propertyType?.$in || []), ...commercialTypes],
      };
    }

    // Handling preferenceHousing filter
    if (preferenceHousing) {
      if (preferenceHousing === "Any") {
        // No filter needed for 'Any'
      } else {
        filter.preference = preferenceHousing;
      }
    }

    // Handling genderPreference filter
    if (genderPreference && preferenceHousing !== "Family") {
      filter.genderPreference = genderPreference;
    }

    // Handling houseType filter
    if (houseType) {
      const houseTypes = houseType.split(",");
      filter.type = { $in: houseTypes };
    }

    // Handling city filter
    if (city) {
      filter.city = city;
    }

    // Pagination logic
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch filtered properties from the database with pagination
    const properties = await Property.find(filter).skip(skip).limit(limitNum);

    // Send successful response with filtered properties
    res.status(200).json({
      success: true,
      data: properties,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    // Send error response
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const addReview = async (req, res) => {
  try {
    const { propertyId, user, rating, comment, username } = req.body;

    const review = new Review({
      property: propertyId,
      user,
      rating,
      comment,
      username,
    });
    await review.save();

    // Update the property with the new review
    const property = await Property.findById(propertyId);
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    property.reviews.push(review._id);
    await property.save();

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a review and remove it from the property
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // Remove the review from the property's reviews array
    await Property.updateOne(
      { _id: review.property },
      { $pull: { reviews: reviewId } }
    );

    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const propertyBySlug = asyncHandler(async (req, res, next) => {
  const property = await Property.findOne({ slug: req.params.slug });
  if (!property) {
    return next(new ApiError(400, "Property not found"));
  }
  res.status(200).json(property);
});

const getPropertiesByLocation = async (req, res) => {
  try {
    const location = req.params.location;

    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }

    const properties = await Property.find({ locality: location });

    if (properties.length === 0) {
      return res
        .status(404)
        .json({ message: `No properties found in ${location}` });
    }

    return res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  propertyBySlug,
  addProperty,
  updateProperty,
  deleteProperty,
  GetProperty,
  getPropertyById,
  getFilteredProperties,
  addReview,
  deleteReview,
  getPropertiesByLocation,
  getPropertyByCity,
};

/**
 * after above done do below steps
 *
 * 1. go to (propertyRoutes.js) file
 *   - then add your route, there are some instructions and eg. follow them and also import your above method there and add there
 */