import { TaskStatus } from "@/api/GaleBrokerAPI";


/**
 * Label badge for task status
 * @returns 
 */
export function StatusBadge({ status }: { status: TaskStatus }) {
    const colors = {
        published: "bg-gray-100 text-gray-800",
        started: "bg-blue-100 text-blue-800",
        waiting: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-300 text-green-800",
        failed: "bg-red-100 text-red-800",
        childrenCompleted: "bg-green-300 text-green-800"
    };

    return (
        <div className={`flex ${colors[status]} w-8 h-8 justify-center items-center rounded-full`}>
            {status === 'completed' || status == 'childrenCompleted' ? (
                <svg className="w-4 h-4 inline" viewBox="0 -3 32 32" fill="currentColor">
                    <path d="M548.783,1040.2 C547.188,1038.57 544.603,1038.57 543.008,1040.2 L528.569,1054.92 L524.96,1051.24 C523.365,1049.62 520.779,1049.62 519.185,1051.24 C517.59,1052.87 517.59,1055.51 519.185,1057.13 L525.682,1063.76 C527.277,1065.39 529.862,1065.39 531.457,1063.76 L548.783,1046.09 C550.378,1044.46 550.378,1041.82 548.783,1040.2" transform="translate(-518, -1039)" />
                </svg>
            ) : null}
        </div>
    );
}
