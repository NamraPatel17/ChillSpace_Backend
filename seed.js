const mongoose = require("mongoose");
const Property = require("./src/models/PropertyModel");
const User = require("./src/models/UserModel");

const seedData = [
  {
    title: "Luxury Beach Villa",
    location: "Malibu, California",
    pricePerNight: 450,
    rating: 4.9,
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    images: ["https://images.unsplash.com/photo-1772398539093-fc7b4a6b1bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWFjaCUyMHZpbGxhJTIwdmFjYXRpb24lMjByZW50YWx8ZW58MXx8fHwxNzczNzIxOTczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
    amenities: ["WiFi", "Pool", "Parking", "Ocean View"],
    propertyType: "Villa"
  },
  {
    title: "Mountain Cabin Retreat",
    location: "Aspen, Colorado",
    pricePerNight: 325,
    rating: 4.8,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    images: ["https://images.unsplash.com/photo-1769021488077-3a921b227daf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtb3VudGFpbiUyMGNhYmlufGVufDF8fHx8MTc3MzcyMTk3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
    amenities: ["WiFi", "Fireplace", "Parking", "Mountain View"],
    propertyType: "House"
  },
  {
    title: "Downtown Loft",
    location: "New York, NY",
    pricePerNight: 275,
    rating: 4.7,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    images: ["https://images.unsplash.com/photo-1526547050953-b9fe7299eb69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb3dudG93biUyMGNpdHklMjBhcGFydG1lbnQlMjBsb2Z0fGVufDF8fHx8MTc3MzcyMTk3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
    amenities: ["WiFi", "Gym", "City View", "Pet Friendly"],
    propertyType: "Apartment"
  },
  {
    title: "Lakeside Cottage",
    location: "Lake Tahoe, Nevada",
    pricePerNight: 200,
    rating: 4.9,
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    images: ["https://images.unsplash.com/photo-1684602766513-7d0694cd5bd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWtlc2lkZSUyMGNvdHRhZ2UlMjBob21lfGVufDF8fHx8MTc3MzcyMTk3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
    amenities: ["WiFi", "Dock", "Parking", "Lake View"],
    propertyType: "House"
  },
  {
    title: "Tropical Resort Villa",
    location: "Maui, Hawaii",
    pricePerNight: 550,
    rating: 5.0,
    bedrooms: 5,
    bathrooms: 4,
    maxGuests: 10,
    images: ["https://images.unsplash.com/photo-1629711129507-d09c820810b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJlc29ydCUyMHBvb2x8ZW58MXx8fHwxNzczNjQ5OTU2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
    amenities: ["WiFi", "Pool", "Beach Access", "Ocean View"],
    propertyType: "Villa"
  },
  {
    title: "Countryside Farmhouse",
    location: "Tuscany, Italy",
    pricePerNight: 380,
    rating: 4.8,
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    images: ["https://images.unsplash.com/photo-1595940929854-47f1bca6f845?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY291bnRyeXNpZGUlMjBmYXJtaG91c2V8ZW58MXx8fHwxNzczNzIxOTc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"],
    amenities: ["WiFi", "Garden", "Parking", "Country View"],
    propertyType: "House"
  }
];

mongoose.connect("mongodb://127.0.0.1:27017/backend").then(async () => {
  console.log("Connected to MongoDB");
  
  // Find or create a host
  let host = await User.findOne({ role: "Host" });
  if (!host) {
    host = await User.create({
      fullName: "Test Host",
      email: "host@test.com",
      password: "password123",
      role: "Host"
    });
    console.log("Created dummy Host");
  }

  const payload = seedData.map(p => ({ ...p, hostId: host._id }));
  
  await Property.insertMany(payload);
  console.log("Successfully seeded properties!");
  
  mongoose.connection.close();
}).catch(err => {
  console.error(err);
  mongoose.connection.close();
});
