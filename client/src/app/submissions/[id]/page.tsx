import Poll from "./poll";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const SubmissionDetails = async ({params}:Props) => {
    const {id}= await params;
    return (
        <div>
            <Poll id={id} />
        </div>
    );
};

export default SubmissionDetails;