type Props = {
  params: Promise<{
    id: string;
  }>;
};

const SubmissionDetails = async ({params}:Props) => {
    const {id}= await params;
    return (
        <div>
            this is submission details page for ID: {id}
        </div>
    );
};

export default SubmissionDetails;