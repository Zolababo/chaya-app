"use client";



import dynamic from "next/dynamic";

import { useMemo } from "react";



import { MerchantAnalyticsPeriodPicker } from "@/components/merchant-analytics-period-picker";

import { MerchantAnalyticsSummary } from "@/components/merchant-analytics-summary";

import {

  MerchantGuestInsightsList,

  MerchantGuestInsightsSummary,

} from "@/components/merchant-guest-insights-panel";

import { MerchantLoadingCenter } from "@/components/merchant-loading-center";

import {

  merchantAnalyticsLiveQuery,

  type MerchantAnalyticsQueryParams,

} from "@/lib/merchant/merchant-analytics-request";

import { merchantCacheKey } from "@/lib/merchant/merchant-client-cache";

import { parseMerchantLiveAnalytics } from "@/lib/merchant/merchant-live-types";

import { useMerchantLiveFetch } from "@/lib/merchant/use-merchant-live-fetch";



const MerchantAnalyticsCharts = dynamic(

  () => import("@/components/merchant-analytics-charts").then((m) => m.MerchantAnalyticsCharts),

  {

    loading: () => <MerchantLoadingCenter context="analytics" compact className="py-12" />,

    ssr: false,

  },

);



type Props = {

  tenant: string;

  role: string;

  query: MerchantAnalyticsQueryParams;

  currentDays: number | null;

  currentFrom: string | null;

  currentTo: string | null;

  currentMonth: boolean;

  isLastMonth: boolean;

};



function analyticsCacheSuffix(query: MerchantAnalyticsQueryParams): string {

  return [

    query.days ?? "",

    query.from ?? "",

    query.to ?? "",

    query.month ?? "",

    query.lastmonth ?? "",

  ].join("|");

}



export function MerchantAnalyticsPageClient({

  tenant,

  role,

  query,

  currentDays,

  currentFrom,

  currentTo,

  currentMonth,

  isLastMonth,

}: Props) {

  const tEnc = encodeURIComponent(tenant);

  const querySuffix = analyticsCacheSuffix(query);

  const analyticsCacheKey = merchantCacheKey(tenant, "analytics", querySuffix);

  const analyticsUrl = `/m/${tEnc}/live/analytics${merchantAnalyticsLiveQuery(query)}`;



  const analyticsFetch = useMerchantLiveFetch({

    tenant,

    cacheKey: analyticsCacheKey,

    url: analyticsUrl,

    invalidateScope: "analytics",

    parse: parseMerchantLiveAnalytics,

    staleTimeMs: 45_000,

  });



  const snapshot = analyticsFetch.data?.snapshot;

  const guestSnapshot = analyticsFetch.data?.guestSnapshot;

  const loadError =

    analyticsFetch.error ??

    (analyticsFetch.data == null && !analyticsFetch.isRefreshing

      ? "분석 데이터를 불러오지 못했습니다."

      : null);



  const chartProps = useMemo(() => {

    if (!snapshot) return null;

    return {

      daily: snapshot.daily,

      prevDaily: snapshot.prevDaily,

      hourly: snapshot.hourly,

      byWeekday: snapshot.byWeekday,

      topMenus: snapshot.topMenus,

      cancelReasons: snapshot.cancelReasons,

      days: snapshot.days,

    };

  }, [snapshot]);



  const showInitialLoader = !snapshot && analyticsFetch.isRefreshing;



  return (

    <>

      {role === "finance" ? (

        <p

          role="status"

          className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100"

        >

          정산 전용 계정입니다. 주문·메뉴는 변경할 수 없고 분석만 조회합니다.

        </p>

      ) : null}



      <MerchantAnalyticsPeriodPicker

        tenant={tenant}

        currentDays={currentDays}

        currentFrom={currentFrom}

        currentTo={currentTo}

        currentMonth={currentMonth}

        currentLastMonth={isLastMonth}

      />



      {showInitialLoader ? <MerchantLoadingCenter context="analytics" /> : null}



      {loadError ? (

        <p

          role="alert"

          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"

        >

          {loadError}

        </p>

      ) : null}



      {snapshot ? (

        <>

          <div className="merchant-analytics-body space-y-4">

            <div className="merchant-analytics-summary-pane space-y-4">

              <MerchantAnalyticsSummary

                days={snapshot.days}

                orderCount={snapshot.orderCount}

                totalSales={snapshot.totalSales}

                completedCount={snapshot.completedCount}

                cancelledCount={snapshot.cancelledCount}

                prevTotalSales={snapshot.prevDaily.reduce((s, d) => s + d.sales, 0)}

                prevOrderCount={snapshot.prevDaily.reduce((s, d) => s + d.orders, 0)}

                fromDate={currentFrom}

                toDate={currentTo}

              />



              {guestSnapshot ? (

                <div className="space-y-3">

                  <MerchantGuestInsightsSummary

                    periodLabel={guestSnapshot.periodLabel}

                    completedVisits={guestSnapshot.completedVisits}

                    uniqueGuests={guestSnapshot.uniqueGuests}

                    returningGuests={guestSnapshot.returningGuests}

                    regularGuests={guestSnapshot.regularGuests}

                  />

                  <MerchantGuestInsightsList

                    guests={guestSnapshot.guests}

                    hiddenCount={guestSnapshot.guestsHiddenCount}

                    periodLabel={guestSnapshot.periodLabel}

                  />

                </div>

              ) : null}

            </div>

            <div className="merchant-analytics-charts-pane">

              {chartProps ? <MerchantAnalyticsCharts {...chartProps} /> : null}

            </div>

          </div>

          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">

            주문 {snapshot.orderCount.toLocaleString("ko-KR")}건 기준 · 최대 2,500건 집계

          </p>

        </>

      ) : null}

    </>

  );

}

