import React from "react";
import theme from "theme";
import { Theme, Link, Text, Box, Section } from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { RawHtml, Override } from "@quarkly/components";
import Footer from "./footer";
export default (() => {
	return <Theme theme={theme}>
		<GlobalQuarklyPageStyles pageUrl={"404"} />
		<Helmet>
			<title>
				Error 404
			</title><link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
		</Helmet>
		<Section padding="88px 0 88px 0" min-height="100vh" quarkly-title="404-1">
			<Override slot="SectionContent" max-width="1220px" justify-content="center" />
			<Box align-items="center" display="flex" justify-content="center" flex-direction="column">
				<Text margin="0px 0px 0px 0px" font="--headline3" color="--primary">
					404
				</Text>
				<Text
					color="--dark"
					margin="8px 0px 16px 0px"
					sm-font="normal 700 42px/1.2 &quot;Source Sans Pro&quot;, sans-serif"
					font="--headline1"
					letter-spacing="-0.025em"
				>
					Page not found
				</Text>
				<Text
					lg-width="80%"
					font="--lead"
					color="--dark"
					margin="0px 0px 40px 0px"
					text-align="center"
				>
					Sorry, we couldn’t find the page you’re looking for.
				</Text>
				<Link
					font="--lead"
					padding="12px 24px 12px 24px"
					background="--color-primary"
					border-radius="8px"
					href="/"
					text-decoration-line="initial"
					color="--light"
					transition="--opacityOut"
					hover-opacity="0.7"
				>
					Go back to home
				</Link>
			</Box>
		</Section>
		
		<RawHtml>
			<style place={"endOfHead"} rawKey={"66f6d1359710450018a331b3"}>
				{":root {\n  box-sizing: border-box;\n}\n\n* {\n  box-sizing: inherit;\n}"}
			</style>
		</RawHtml>
		{/* <Footer /> */}
	</Theme>;
});