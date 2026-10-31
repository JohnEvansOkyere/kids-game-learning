"""
Print the playtest retention report from the events table

    python -m scripts.retention_report
"""
import asyncio

from prisma import Prisma

from app.retention import retention_report, utc_today


async def main():
    db = Prisma()
    await db.connect()
    try:
        events = await db.event.find_many()
        students = {s.id: s for s in await db.student.find_many()}
        report = retention_report(
            ({"studentId": e.studentId, "name": e.name, "occurredAt": e.occurredAt, "props": e.props}
             for e in events),
            utc_today(),
        )
    finally:
        await db.disconnect()

    def pct(value):
        return "-" if value is None else f"{value}%"

    print(f"Players: {report['players']}")
    print(f"Day-1 return: {pct(report['day1ReturnPercent'])}   Day-7 return: {pct(report['day7ReturnPercent'])}")
    print(f"Average sessions per week: {report['avgSessionsPerWeek'] or '-'}\n")

    def yes_no(value):
        return "-" if value is None else ("yes" if value else "no")

    print(f"{'Child':<16}{'Grade':<7}{'First day':<12}{'Days':>5}{'Sess/wk':>9}{'D1':>5}{'D7':>5}{'Stages':>8}")
    for student_id, m in sorted(report["students"].items(), key=lambda kv: kv[1]["firstDay"]):
        student = students.get(student_id)
        name = student.name if student else student_id[:8]
        grade = student.gradeLevel if student else "?"
        print(
            f"{name[:15]:<16}{grade:<7}{m['firstDay']:<12}{m['activeDays']:>5}{m['sessionsPerWeek']:>9}"
            f"{yes_no(m['returnedDay1']):>5}{yes_no(m['returnedDay7']):>5}{m['nodesCompleted']:>8}"
        )


if __name__ == "__main__":
    asyncio.run(main())
