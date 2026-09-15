import { HomeContent } from "@/components/home/home-content"
import { getUserBySession } from "@/lib/auth"

export default async function Home() {
	const user = await getUserBySession()

	return <HomeContent userName={user?.name} />
}
