import { FitbitDailyActivityStepsQueryResult } from "./types";
import { FitbitSummaryLogMeasure } from "./FitbitSummaryLogMeasure";
import { StepCountRangedData } from "../../../core/exploration/data/types";
import { DataSourceType } from "@data-at-hand/core/measure/DataSourceSpec";
import { FitbitLocalTableName } from "./sqlite/database";
import { DataSourceChartFrame } from "../../../components/exploration/DataSourceChartFrame";
import SQLite, { DatabaseParams } from 'react-native-sqlite-storage';
import React, { useCallback, useMemo } from 'react';

SQLite.DEBUG(false);
SQLite.enablePromise(true);


export class FitbitDailyStepMeasure extends FitbitSummaryLogMeasure<FitbitDailyActivityStepsQueryResult> {

  protected dbTableName = FitbitLocalTableName.StepCount;

  key = 'daily_step'
  displayName = "Step Count"

  protected resourcePropertyKey: string = "activities-steps"

  protected queryFunc(startDate: number, endDate: number, prefetchMode: boolean): Promise<FitbitDailyActivityStepsQueryResult> {
    return this.core.fetchStepDailySummary(startDate, endDate, prefetchMode)
  }

  protected shouldReject(rowValue: number): boolean {
    return rowValue === 0
  }

  protected getLocalRangeQueryCondition(startDate: number, endDate: number): string {
    return super.getLocalRangeQueryCondition(startDate, endDate) + ' AND value > 25'
  }

  protected getQueryResultEntryValue(queryResultEntry: any) {
    return Number.parseInt(queryResultEntry.value)
  }


open(): Promise<SQLite.SQLiteDatabase> {

    console.log("try open the database:", );

    _dbInitPromise = SQLite.openDatabase({ name: 'fitbit-local-cache.sqlite' })
      .then(db => {
        console.log("db opened.")
        return db
          .transaction(tx => {
          console.log("-------------------------------------- Opening Database ");


          //tx.executeSql('DROP TABLE IF EXISTS blood_glucose_level', []);

          tx.executeSql(
                        'CREATE TABLE IF NOT EXISTS blood_glucose_level(day_of_week INTEGER, month INTEGER, numberedDate DATE, value INTEGER, year INTEGER)',
                        []
                      );
          }).then(tx => db)
      })
    return _dbInitPromise
  }

async performDatabaseOperation(startDate: number, endDate: number) : any {

/*   await (await this.open()).executeSql('INSERT INTO blood_glucose_level ( day_of_week, month, numberedDate, value, year) VALUES (?,?,?,?,?)',
                                                                         [ 6, 1, 20220201, 60000, 2022]);
//     console.log("-------------------------------------- Inserting into table ");

     await (await this.open()).executeSql('INSERT INTO blood_glucose_level ( day_of_week, month, numberedDate, value, year) VALUES (?,?,?,?,?)',
                                                              [1, 1, 20220126, 60000, 2022]);

       await (await this.open()).executeSql('INSERT INTO blood_glucose_level ( day_of_week, month, numberedDate, value, year) VALUES (?,?,?,?,?)',
                                                                    [ 2, 1, 20220127, 30058, 2022]);

       await (await this.open()).executeSql('INSERT INTO blood_glucose_level ( day_of_week, month, numberedDate, value, year) VALUES (?,?,?,?,?)',
                                                                    [ 3, 1, 20220128, 40000, 2022]);

       await (await this.open()).executeSql('INSERT INTO blood_glucose_level (day_of_week, month, numberedDate, value, year) VALUES (?,?,?,?,?)',
                                                                    [ 4, 1, 20220129, 50000, 2022]);
       await (await this.open()).executeSql('INSERT INTO blood_glucose_level ( day_of_week, month, numberedDate, value, year) VALUES (?,?,?,?,?)',
                                                                    [5, 1, 20220130, 2000, 2022]);

       await (await this.open()).executeSql('INSERT INTO blood_glucose_level ( day_of_week, month, numberedDate, value, year) VALUES (?,?,?,?,?)',
                                                                    [ 6, 1, 20220131, 5000, 2022]);

*/

      console.log("-------------------------------------- Fetching data from table ");

      const [result] = await (await this.open()).executeSql('select day_of_week as dayOfWeek, month, numberedDate, value, year from blood_glucose_level where numberedDate BETWEEN ? and ?',
                                                                                [startDate,endDate]);
      //const dbnames= await (await this.open()).executeSql('SELECT * FROM StepCount',[]);

      //console.log("%%%%%%%%%%%%%%%% database names",dbnames);


      console.log("*********************** 0th row = ", result.rows.item(0));
      //console.log("********************************** RESULT = ", result);
      console.log("********************************** RESULT size = ", result.rows.length);
      return result;
}



  async fetchData(startDate: number, endDate: number, includeStatistics: boolean, includeToday: boolean): Promise<StepCountRangedData> {
    //const rangedData = await super.fetchPreliminaryData(startDate, endDate, includeStatistics)

    const rangedData = await super.fetchPreliminaryBloodGlucoseData(startDate, endDate, includeStatistics)

       console.log("VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVv",startDate);
        console.log("VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVv",endDate);
     let finalResult2 = await this.performDatabaseOperation(startDate, endDate);
     /* let finalResult = [];
     console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",finalResult2);
    const result2 = this.performDatabaseOperation().then(
            (result) => {
                    // if (result != null){

                    for (let i = 0; i < result.rows.length; i++)
                    {
                        finalResult.push(result.rows.item(i));
                        //console.log("VVVVVVVVVVVVVVVVVVVVVVVVVVV",result.rows.item(i));
                    }
                   },
                              (onRejected) => {
                                      console.log("PerformDatabaseOperation() -> Promise rejected ", onRejected);
                                  }
             );*/

    let temp = [];
    for (let i = 0; i < finalResult2.rows.length; i++)
         {
              temp.push(finalResult2.rows.item(i));
                            //console.log("VVVVVVVVVVVVVVVVVVVVVVVVVVV",result.rows.item(i));
         }
    console.log("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",finalResult2);
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",finalResult2.rows.item(0));




    const base = {
      source: DataSourceType.StepCount,
      data: temp,
      range: [startDate, endDate],
      today: includeToday === true ? await this.fetchTodayValue() : null,
      statistics: [
        { type: 'avg', value: rangedData.avg },
        { type: 'total', value: rangedData.sum },
        { type: 'range', value: [rangedData.min, rangedData.max] }
        /*
        {label: STATISTICS_LABEL_AVERAGE + " ", valueText: commaNumber(Math.round(rangedData.avg))},
        {label: STATISTICS_LABEL_TOTAL + " ", valueText: commaNumber(rangedData.sum)},
        {label: STATISTICS_LABEL_RANGE+ " ", valueText: commaNumber(rangedData.min) + " - " + commaNumber(rangedData.max)}*/
      ]
    } as StepCountRangedData

    console.log("IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII",base);
    return base
  }
}
