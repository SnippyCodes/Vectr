import { useMemo } from 'react';

export default function CommitMap({ data = [] }) {
    const weeks = useMemo(() => {
        if (!data.length) {
            // Generate empty 52-week grid
            const grid = [];
            for (let w = 0; w < 52; w++) {
                const week = [];
                for (let d = 0; d < 7; d++) {
                    week.push({ date: '', count: 0 });
                }
                grid.push(week);
            }
            return grid;
        }

        // Group data into weeks (7 days each)
        const grid = [];
        let currentWeek = [];
        data.forEach((day, i) => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                grid.push(currentWeek);
                currentWeek = [];
            }
        });
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) currentWeek.push({ date: '', count: 0 });
            grid.push(currentWeek);
        }
        return grid;
    }, [data]);

    const getColor = (count) => {
        if (count === 0) return '#151620';
        if (count <= 2) return '#222534';
        if (count <= 5) return '#34384d';
        if (count <= 10) return '#4b506d';
        return '#f59e0b';
    };

    return (
        <div className="overflow-x-auto select-none py-1">
            <div className="flex gap-[3.5px]" style={{ minWidth: 'fit-content' }}>
                {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3.5px]">
                        {week.map((day, di) => (
                            <div
                                key={di}
                                className="rounded-[3px] transition-all duration-150 hover:scale-125 hover:z-10 cursor-pointer border border-white/[0.03]"
                                style={{
                                    width: 11.5,
                                    height: 11.5,
                                    backgroundColor: getColor(day.count),
                                }}
                                title={day.date ? `${day.date}: ${day.count} contribution${day.count === 1 ? '' : 's'}` : 'No contributions'}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between pt-3 text-[11px] font-sans text-[#7d8091]">
                <span>52 weeks contribution history</span>
                <div className="flex items-center gap-1.5">
                    <span>Less</span>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#151620] border border-white/[0.08]" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#222534]" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#34384d]" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4b506d]" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#f59e0b]" />
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
