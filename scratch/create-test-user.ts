import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

const dbRef = "tggufvedwtpcxamkqihy";
const directDbUrl = `postgresql://postgres:${encodeURIComponent("Sillycore123@")}@db.${dbRef}.supabase.co:5432/postgres`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directDbUrl,
    },
  },
});

async function main() {
  const email = "cw.curiowraps@gmail.com";
  console.log(`Checking if user ${email} exists...`);
  
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log("User already exists:", user);
  } else {
    console.log("User does not exist. Creating user...");
    // Find a role to assign
    const role = await prisma.role.findFirst({
      where: { name: "CUSTOMER" },
    });
    
    if (!role) {
      throw new Error("CUSTOMER role not found in database.");
    }

    user = await prisma.user.create({
      data: {
        email,
        firstName: "Curio",
        lastName: "Wrap",
        status: "ACTIVE",
        passwordHash: "$2a$12$EixZaYVK1fsby1Aebt3Hee3nU9.19b91b91b91b91b91b91b91b91", // Dummy hash
        roleId: role.id,
      },
    });
    console.log("User created successfully:", user);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
