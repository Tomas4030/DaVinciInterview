import { redirect } from "next/navigation";

type Props = {
  params: { locale: string; slug: string };
};

export default function AdminCompanyIndexPage({ params }: Props) {
  redirect(`/${params.locale}/admin/${params.slug}/dashboard`);
}
