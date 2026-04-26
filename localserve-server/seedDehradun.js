const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const categories = [
  { name: "Electrician", icon: "electric_bolt", tags: "Wiring, Repairs, Installations" },
  { name: "Plumber", icon: "plumbing", tags: "Pipes, Leaks, Bathroom" },
  { name: "Home Cleaning", icon: "cleaning_services", tags: "Deep Clean, Sofa Clean" },
  { name: "AC Repair", icon: "ac_unit", tags: "Service, Gas refill, Repair" },
  { name: "Pest Control", icon: "pest_control", tags: "Termites, Roaches, Bedbugs" },
  { name: "Appliance Repair", icon: "kitchen", tags: "Fridge, Washing Machine" },
  { name: "Painter", icon: "format_paint", tags: "House Painting, Texture" },
  { name: "Carpenter", icon: "handyman", tags: "Furniture, Doors, Repairs" }
];

const indianFirstNames = ["Aarav", "Vihaan", "Aditya", "Rohan", "Kabir", "Neha", "Priya", "Anjali", "Riya", "Kavya", "Suresh", "Ramesh", "Deepak", "Vikram", "Amit", "Rahul", "Sumit", "Rajesh", "Pooja", "Sunita", "Swati", "Nikhil", "Akash", "Manish", "Gaurav"];
const indianLastNames = ["Sharma", "Verma", "Singh", "Gupta", "Joshi", "Patel", "Kumar", "Chauhan", "Bist", "Rawat", "Negi", "Thakur", "Yadav", "Mishra", "Pandey"];

const randomName = () => `${indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)]} ${indianLastNames[Math.floor(Math.random() * indianLastNames.length)]}`;

// Dehradun bounding box approx coordinates
const D_LAT = 30.3165;
const D_LNG = 78.0322;

async function main() {
  console.log("Seeding Dehradun providers...");
  
  // We need to create a dummy user to be the reviewer
  let reviewer = await prisma.user.findFirst({ where: { email: 'reviewer@test.com' } });
  if (!reviewer) {
    const pw = await bcrypt.hash('password123', 10);
    reviewer = await prisma.user.create({
      data: {
        name: "Test Reviewer",
        email: "reviewer@test.com",
        password: pw,
        location: "Dehradun",
        role: "user"
      }
    });
  }

  let count = 0;
  for (let i = 0; i < 60; i++) {
    const isVerified = Math.random() > 0.4; // 60% verified
    const isAI = Math.random() > 0.7; // 30% AI recommended
    
    const catIndex = i % categories.length; // distribute evenly
    const cat = categories[catIndex];
    const name = randomName();
    const email = `provider_${i}_${Date.now()}@test.com`;
    const password = await bcrypt.hash('password123', 10);
    
    // Slight random offset for locations
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: `9999${Math.floor(100000 + Math.random() * 900000)}`,
        password,
        location: "Dehradun, UK",
        role: "provider",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        lat: D_LAT + latOffset,
        lng: D_LNG + lngOffset
      }
    });

    const tagsArray = cat.tags.split(', ').map(t => t.trim());
    if (isAI) tagsArray.push("AI Recommended");

    const expYears = Math.floor(Math.random() * 15) + 1; // 1 to 15 years
    const basePrice = Math.floor(Math.random() * 80) * 10 + 200; // 200 to 1000

    const profile = await prisma.providerProfile.create({
      data: {
        userId: user.id,
        service: cat.name,
        serviceIcon: cat.icon,
        description: `Professional ${cat.name} offering high quality services in Dehradun. Satisfaction guaranteed.`,
        experience: `${expYears} years`,
        basePrice,
        distance: Number((Math.random() * 15 + 1).toFixed(1)), // 1 to 16 km
        lat: D_LAT + latOffset,
        lng: D_LNG + lngOffset,
        available: true,
        verified: isVerified,
        tags: JSON.stringify(tagsArray)
      }
    });

    // Add 1-3 Provider Services
    const numServices = Math.floor(Math.random() * 3) + 1;
    for(let s = 0; s < numServices; s++) {
      await prisma.providerService.create({
        data: {
          providerProfileId: profile.id,
          category: `${cat.name} Service ${s+1}`,
          experience: `${expYears} years`,
          price: basePrice + (s * 150),
          description: `Detailed description for ${cat.name} sub-service`
        }
      });
    }

    // Add random number of reviews between 0 to 15
    const numReviews = Math.floor(Math.random() * 15);
    for(let r = 0; r < numReviews; r++) {
      // Skew ratings towards 4 and 5
      const randomDraw = Math.random();
      let rating = 5;
      if (randomDraw < 0.2) rating = 3;
      else if (randomDraw < 0.5) rating = 4;

      await prisma.review.create({
        data: {
          userId: reviewer.id,
          providerProfileId: profile.id,
          rating,
          comment: `Great service! Rating: ${rating}/5. Strongly recommend for ${cat.name}.`,
          // randomize dates over the last month to test freshness
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 45) * 86400000)
        }
      });
    }
    count++;
  }
  console.log(`Successfully seeded ${count} dummy providers in Dehradun!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
