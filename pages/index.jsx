import { useState, useEffect, useReducer } from "react";
import {
  LayoutPage,
  LayoutPageContent,
  LayoutPageHeader,
} from "components/layout/index";
import withSession from "lib/session";
import { Verified } from "components/ui/svg/verified-icon";
import { OfficeBuildingIcon } from "@heroicons/react/solid";
import {
  ShieldCheckIcon,
  FireIcon,
  ChatAlt2Icon,
} from "@heroicons/react/outline";
import { StatsWithIcon } from "components/ui/stats/stats-with-icon";
import { getNickName } from "components/utils";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Card,
  AreaChart,
  Title,
  BarChart,
  Subtitle,
  Flex,
  BarList,
  Text,
  DateRangePicker,
  DonutChart,
  Legend,
} from "@tremor/react";
import { DotBlink } from "components/ui/svg/spinner";

export default function Home({ user, statsIncidentData }) {
  const cards = [
    {
      name: "Incidents Open",
      href: "/incidents",
      icon: ShieldCheckIcon,
      value: statsIncidentData.data.jumlah,
    },
    {
      name: "Problem Management",
      href: "/problem",
      icon: FireIcon,
      value: 0,
    },
    {
      name: "Ticket Open",
      href: "#",
      icon: ChatAlt2Icon,
      value: 0,
    },
  ];

  const [datePickerValue, setDatePickerValue] = useState([
    new Date(2022, 0, 1),
    new Date(),
  ]);

  const handleDateRangeFilter = (value) => {
    setDatePickerValue(value);
  };

  const strStartDate = format(datePickerValue[0], "yyyy-MM-dd");
  const strEndDate = datePickerValue[1]
    ? format(datePickerValue[1], "yyyy-MM-dd")
    : "";

  const [chart, updateChart] = useReducer(
    (data, partialData) => ({
      ...data,
      ...partialData,
    }),
    {
      totalIncident: { data: [], error: null, loading: false },
      totalIncidentByType: { data: [], error: null, loading: false },
      totalIncidentByCategory: { data: [], error: null, loading: false },
      averageDetect: { data: [], error: null, loading: false },
      averageResolved: { data: [], error: null, loading: false },
      top5App: { data: [], error: null, loading: false },
    }
  );

  let endpoints = [
    `${process.env.NEXT_PUBLIC_API_URL_V2}/dashboards/incident-total-line?startTime=${strStartDate}&endTime=${strEndDate}`,
    `${process.env.NEXT_PUBLIC_API_URL_V2}/dashboards/incident-total-type-area?startTime=${strStartDate}&endTime=${strEndDate}`,
    `${process.env.NEXT_PUBLIC_API_URL_V2}/dashboards/incident-avg-detect?startTime=${strStartDate}&endTime=${strEndDate}`,
    `${process.env.NEXT_PUBLIC_API_URL_V2}/dashboards/incident-avg-resolved?startTime=${strStartDate}&endTime=${strEndDate}`,
    `${process.env.NEXT_PUBLIC_API_URL_V2}/dashboards/incident-top-app-pie?startTime=${strStartDate}&endTime=${strEndDate}`,
  ];

  useEffect(() => {
    updateChart({
      totalIncident: { loading: true },
      totalIncidentByType: { loading: true },
      totalIncidentByCategory: { loading: true },
      averageDetect: { loading: true },
      averageResolved: { loading: true },
      top5App: { loading: true },
    });

    axios
      .all(
        endpoints.map((endpoint) =>
          axios
            .get(endpoint, {
              headers: { Authorization: `Bearer ${user.accessToken}` },
            })
            .catch((error) => {
              if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                toast.error(
                  `Server responded with an error status code: 
                  ${error.response.status}`
                );
              } else if (error.request) {
                // The request was made but no response was received
                toast.error(
                  `No response received from server: ${error.request}`
                );
              } else {
                // Something happened in setting up the request that triggered an Error
                toast.error(`Error setting up request: ${error.message}`);
              }
              // throw the error to propagate it to the next error handler or catch block
              throw error;
            })
        )
      )
      .then(
        axios.spread(
          (
            { data: totalIncident },
            { data: totalIncidentByType },
            { data: averageDetect },
            { data: averageResolved },
            { data: top5App }
          ) => {
            const newTop5App = top5App.data.map((d) => ({
              name: d.subNameAplikasi,
              value: d.jumlahIncident,
            }));

            updateChart({
              totalIncident: { data: totalIncident.data, loading: false },
              totalIncidentByType: {
                data: totalIncidentByType.data,
                loading: false,
              },
              averageDetect: { data: averageDetect.data, loading: false },
              averageResolved: { data: averageResolved.data, loading: false },
              top5App: { data: newTop5App, loading: false },
            });
          }
        )
      );
  }, [datePickerValue]);

  return (
    <LayoutPage session={user} pageTitle="Home Dashboard - Shield">
      <LayoutPageHeader>
        <div className="py-6 md:flex md:items-center md:justify-between lg:border-t lg:border-gray-200">
          <div className="flex-1 min-w-0">
            {/* Profile */}
            <div className="flex items-center">
              <img
                loading="lazy"
                className="h-16 w-16 text-gray-500 sm:block"
                // src={user.photo}
                src="/Slightly_Smiling_Face.png"
                alt="User Proflie"
              />
              <div>
                <div className="flex items-center">
                  <h1 className="ml-3 text-2xl font-bold leading-7 text-gray-900 sm:leading-9 sm:truncate">
                    Welcome back,{" "}
                    {user.fullname ? getNickName(user.fullname) : user.username}{" "}
                  </h1>
                  {/* <img
                    src="/Waving_Hand.png"
                    alt="Hand with Fingers Splayed Light Skin Tone"
                    className="h-10 w-10"
                  /> */}
                </div>
                <dl className="mt-6 flex flex-col sm:ml-3 sm:mt-1 sm:flex-row sm:flex-wrap">
                  <dt className="sr-only">Company</dt>
                  <dd className="flex items-center text-sm text-gray-500 font-medium capitalize sm:mr-6">
                    <OfficeBuildingIcon
                      className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    Bank Rakyat Indonesia
                  </dd>
                  <dt className="sr-only">Account status</dt>
                  <dd className="mt-3 flex items-center text-sm text-gray-500 font-medium sm:mr-6 sm:mt-0 capitalize">
                    <Verified
                      className="flex-shrink-0 mr-1.5 h-5 w-5"
                      aria-hidden="true"
                    />
                    Verified Bristars account
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
            {/* You can add component in right section here */}
            <DateRangePicker
              className="max-w-md mx-auto"
              value={datePickerValue}
              onValueChange={handleDateRangeFilter}
              // locale={es}
            />
          </div>
        </div>
      </LayoutPageHeader>
      <LayoutPageContent>
        <div>
          <div className="grid grid-cols-1 gap-4 pb-8 sm:grid-cols-1">
            <h2 className="text-lg font-medium leading-6 text-gray-900">
              Genneral Report
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card */}
              {cards.map((card) => (
                <StatsWithIcon
                  key={card.name}
                  name={card.name}
                  icon={card.icon}
                  href={card.href}
                  value={card.value}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 pb-8">
            <h2 className="text-lg font-medium leading-6 text-gray-900">
              Incident Report
            </h2>
            <div className="grid grid-cols-5 gap-4">
              <div></div>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 xxl:grid-cols-5">
              <div className="col-span-2">
                <Card>
                  <Flex>
                    <Title className="w-full">Total Incident</Title>
                    {chart.totalIncident.loading && <DotBlink />}
                  </Flex>
                  <BarChart
                    data={chart.totalIncident.data}
                    dataKey="rentangWaktu"
                    categories={["jumlahIncident"]}
                    colors={["blue"]}
                    marginTop="mt-6"
                    yAxisWidth="w-12"
                    showLegend={false}
                  />
                </Card>
                <Card marginTop="mt-3">
                  <Flex>
                    <div>
                      <Title>Average Detection Duration</Title>
                      <Subtitle>Data in minutes</Subtitle>
                    </div>
                    {chart.averageDetect.loading && <DotBlink />}
                  </Flex>
                  <AreaChart
                    marginTop="mt-4"
                    data={chart.averageDetect.data}
                    categories={["avgDetectInterval"]}
                    dataKey="rentangWaktu"
                    colors={["blue"]}
                    height="h-80"
                    showLegend={false}
                  />
                </Card>
              </div>
              <div className="col-span-2">
                <Card>
                  <Flex>
                    <Title className="w-full">Incident Type</Title>
                    {chart.totalIncidentByType.loading && <DotBlink />}
                  </Flex>
                  <AreaChart
                    marginTop="mt-4"
                    data={chart.totalIncidentByType.data}
                    categories={[
                      "Application",
                      "Infrastructure",
                      "Security & Firewall",
                      "Human Error",
                      "Third Party & Others",
                    ]}
                    dataKey="rentangWaktu"
                    height="h-80"
                  />
                </Card>
                <Card marginTop="mt-3">
                  <Flex>
                    <div>
                      <Title>Average Resolved Duration</Title>
                      <Subtitle>Data in minutes</Subtitle>
                    </div>
                    {chart.averageResolved.loading && <DotBlink />}
                  </Flex>
                  <AreaChart
                    marginTop="mt-4"
                    data={chart.averageResolved.data}
                    categories={["avgResolvedInterval"]}
                    dataKey="rentangWaktu"
                    height="h-80"
                    showLegend={false}
                  />
                </Card>
              </div>
              <div>
                <Card>
                  <Flex>
                    <Title>Top 5 Incident</Title>
                    {chart.top5App.loading && <DotBlink />}
                  </Flex>
                  <Flex
                    justifyContent="justify-start"
                    alignItems="items-baseline"
                    spaceX="space-x-2"
                  ></Flex>
                  <Flex marginTop="mt-6">
                    <Text>Application</Text>
                    <Text textAlignment="text-right">Total</Text>
                  </Flex>
                  <BarList data={chart.top5App.data} marginTop="mt-2" />
                </Card>
                <Card marginTop="mt-3">
                  <Legend categories={[]} className="mt-6" />
                  <DonutChart
                    className="mt-6"
                    data={chart.top5App.data}
                    category="value"
                    index="name"
                  />
                </Card>
              </div>
            </div>
          </div>
        </div>
      </LayoutPageContent>
    </LayoutPage>
  );
}

export const getServerSideProps = withSession(async function ({ req, res }) {
  const user = req.session.get("user");
  if (!user) {
    return {
      redirect: {
        destination: "/auth",
        permmanent: false,
      },
    };
  }

  const myApi = {
    url: process.env.NEXT_PUBLIC_API_URL,
    urlv2: process.env.NEXT_PUBLIC_API_URL_V2,
    headers: { Authorization: `Bearer ${user.accessToken}` },
  };

  res = await fetch(`${myApi.url}/dashboards/1/report`, {
    headers: myApi.headers,
  });
  const statsIncidentData = await res.json();

  if (res.status === 200) {
    return {
      props: {
        user: req.session.get("user"),
        statsIncidentData: statsIncidentData,
      },
    };
  }
});
