'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolveQueueItem } from '../lib/api';
import { ReviewItem } from '@/types';

const Actions = ({item,queueItems}:{item: ReviewItem, queueItems: ReviewItem[]}) => {
    const resolve = async (itemId: string, decision: "pass" | "fail") => {
    try {
      const res=await resolveQueueItem(itemId, decision, "instructor");
       if (res.success) {
         const index = queueItems?.findIndex((item) => item._id === itemId); 
         if (index !== -1) {
            // eslint-disable-next-line react-hooks/immutability
            queueItems[index].status = "resolved";
           queueItems[index].decision = decision;
         }
       } else {
         console.error("Failed to resolve item:", res.message);
       }
     
    } catch (err) {
      console.error(err);
    } finally {
    }
  }
    return (
        <div className="
              p-5 border-t bg-gray-50
              flex gap-3
            ">

              <button
                onClick={() => resolve(item?._id,"pass")}
                className="
                  flex-1 rounded-xl
                  bg-green-800 text-white
                  py-3 text-sm font-medium
                  hover:bg-green-500
                  cursor-pointer
                  transition shadow-sm
                "
              >
                ✓ Approve & Award {item?.marks} pts
              </button>


              <button
                onClick={() => resolve(item?._id,"fail")}
                className="
                  flex-1 rounded-xl
                  bg-white border border-red-200
                  text-red-600
                  py-3 text-sm font-medium
                  hover:bg-red-50
                    cursor-pointer
                  transition
                "
              >
                ✕ Reject
              </button>

            </div>
    );
};

export default Actions;