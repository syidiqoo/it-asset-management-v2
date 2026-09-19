import type { Metadata } from "next"

import { UserView } from "@/components/pengaturan/user-view"
import { parseFilterValues } from "@/lib/filters"
import { USER_FILTER_NAMES } from "@/lib/users"

export const metadata: Metadata = {
  title: "User — IT Helpdesk",
}

export default async function UserPage(props: PageProps<"/pengaturan/user">) {
  const searchParams = await props.searchParams
  const { values } = parseFilterValues(searchParams, USER_FILTER_NAMES)

  return <UserView values={values} />
}
