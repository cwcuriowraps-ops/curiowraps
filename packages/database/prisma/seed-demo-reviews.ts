import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding reviews...");

  const products = await prisma.product.findMany({ take: 20 });
  
  const reviewers = [
    { name: "Sarah M.", email: "sarah@example.com", comment: "Absolutely beautiful! The craftsmanship is amazing." },
    { name: "Emily R.", email: "emily@example.com", comment: "So cute and soft. Looks perfect on my desk." },
    { name: "Jessica T.", email: "jess@example.com", comment: "Bought this as a gift and they loved it!" },
    { name: "Amanda K.", email: "amanda@example.com", comment: "Even better than the pictures. Highly recommend." },
    { name: "Rachel B.", email: "rachel@example.com", comment: "Great quality, fast shipping, 10/10." },
  ];

  let userCounter = 1;

  for (const product of products) {
    // Generate 2-3 reviews per product
    const numReviews = Math.floor(Math.random() * 2) + 2; 

    for (let i = 0; i < numReviews; i++) {
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
      
      // Upsert a dummy user to tie the review to
      const email = `reviewer${userCounter++}@example.com`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          firstName: reviewer.name.split(" ")[0],
          lastName: reviewer.name.split(" ")[1] || "",
          passwordHash: "not-needed",
          roleId: (await prisma.role.findFirst({ where: { name: "CUSTOMER" } }))!.id,
          avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${email}`
        }
      });

      await prisma.review.create({
        data: {
          userId: user.id,
          productId: product.id,
          rating: Math.random() > 0.2 ? 5 : 4,
          title: "Loved it!",
          body: reviewer.comment,
          isApproved: true
        }
      });
    }
  }

  console.log("Reviews seeded!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
