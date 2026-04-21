import { redirect } from "next/navigation";

type Props = {
  params: { slug: string };
};

export default function AdminCompanyIndexPage({ params }: Props) {
  redirect(`/admin/${params.slug}/dashboard`);
}
