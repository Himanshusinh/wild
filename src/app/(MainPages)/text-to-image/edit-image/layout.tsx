// Layout to force dynamic rendering for the edit-image route segment
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function EditImageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
