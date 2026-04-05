export class CronParser {
  static parse(expression: string): { minute: number[]; hour: number[]; day: number[]; month: number[]; weekday: number[] } {
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression');
    }

    return {
      minute: this.parseField(parts[0], 0, 59),
      hour: this.parseField(parts[1], 0, 23),
      day: this.parseField(parts[2], 1, 31),
      month: this.parseField(parts[3], 1, 12),
      weekday: this.parseField(parts[4], 0, 6),
    };
  }

  private static parseField(field: string, min: number, max: number): number[] {
    if (field === '*') {
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    }

    const values: number[] = [];
    const ranges = field.split(',');

    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          values.push(i);
        }
      } else {
        values.push(Number(range));
      }
    }

    return values;
  }

  static nextRun(expression: string): Date {
    const parsed = this.parse(expression);
    const now = new Date();
    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setMinutes(next.getMinutes() + 1);

    while (true) {
      if (
        parsed.minute.includes(next.getMinutes()) &&
        parsed.hour.includes(next.getHours()) &&
        parsed.day.includes(next.getDate()) &&
        parsed.month.includes(next.getMonth() + 1) &&
        parsed.weekday.includes(next.getDay())
      ) {
        return next;
      }
      next.setMinutes(next.getMinutes() + 1);
    }
  }
}
