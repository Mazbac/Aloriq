import { getDemoUser, prisma } from "@/lib/prisma";
import { ValuesManager } from "@/components/values/values-manager";

export default async function ValuesPage() {
  const user = await getDemoUser();
  const values = await prisma.value.findMany({
    where: { userId: user.id },
    orderBy: [{ rank: "asc" }, { name: "asc" }],
    include: { criteria: { orderBy: { createdAt: "asc" } } },
  });

  return <ValuesManager values={values} />;
}
