import dotenv from "dotenv";
import sendGrid from "@sendgrid/mail";
dotenv.config();

interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

type Artist = {
  id: string;
  name: string;
  smallImageUrl: string;
  largeImageUrl: string;
  nextPaginationUrl: string;
};

type Track = {
  id: string;
  title: string;
  mp3PreviewUrl: string;
  url: string;
  uri: string;
  artist: {
    id: string;
    name: string;
    url: string;
  };
  album: {
    largeImageUrl: string;
    smallImageUrl: string;
    releaseYear: number;
    id: string;
    name: string;
  };
};

type QuestionnaireFormValues = {
  firstSongHeard: Track[];
  eldersFirstName: string;
  eldersBirthYear: number;
  musicalPreferences: string[];
  favoriteArtistsAsChild: Artist[];
  musiciansFromHeritage: Artist[];
  musiciansParentsListenedTo: Artist[];
  eldersFavoriteArtistsAsTeenager: Artist[];
  mostEmotionalMusicMemory: string;
  songsWithConnectedLifeEvents: Track[];
  songsThatNobodyKnows: Track[];
  songsWithEmotionalMemories: Track[];
  eldersMusicalMemories: string;
  canYouRecallFirstSongYouHeard: boolean;
  doYouHaveLifeEventsConnectedWithSongs: boolean;
  isEthnicMusicImportant: boolean;
};

sendGrid.setApiKey(process.env.SENDGRID_API_KEY as string);

const sendEmail = async (message: Email) => {
  try {
    await sendGrid.send({
      ...message,
      from: process.env.SENDGRID_EMAIL_SENDER as string,
    });
    console.log("Email sent to", message.to);
  } catch (e) {
    console.log("error sending email to ", message.to);
    console.log("SENDER: ", process.env.SENDGRID_EMAIL_SENDER);
    console.log("API KEY: ", process.env.SENDGRID_API_KEY);
    console.error(e);
    //@ts-ignore
    console.error(e.response.body.errors);
  }
};

const sendSongListEmail = async (
  to: string,
  formValues: { question: string; answer: string }[],
  tracks: { title: string; artistName: string }[],
  sessionNotes: string
) => {
  try {
    const listOfTracksInText = tracks
      .map((t) => `${t.title} - ${t.artistName}`)
      .join("<br/>");
    await sendEmail({
      subject: `AIFAPP.COM - Details for your Elder ${formValues[0].answer}`,
      text: "Your elders answers from the Alive Inside app",
      to,
      html: `Dear Alive Inside Hero,<br/><br/>
Thank you so much for doing what so few do. We hope you learned a lot about your elder and yourself!<br/><br/>

<b>Here are your elder, ${
        formValues[0].answer
      }'s Stories and Songlist:</b><br/>

${formValues.map((p) => `${p.question} : <b>${p.answer}</b>`).join("<br/>")}
<br/>
<br/>
<b>Songlist:</b><br/>
${listOfTracksInText}
<br/>
<br/>
${
  sessionNotes?.length > 0
    ? `<b>Your session notes:</b><br/>${sessionNotes}`
    : ""
}

<br/>
<br/>
<br/>
<br/>
Making 'Alive Inside', we met too many elders who were not able to tell us their favorite songs or stories<br/><br/>

Now your Songlist is stored forever!<br/><br/>

Thank you for being an Alive Inside Hero!<br/><br/>

To learn more about our Empathy Revolution, visit <a href="https://www.aliveinside.org/">AliveInside.org</a><br/><br/>

Yours,<br/>
The Alive Inside Team.`,
    });
  } catch (e) {
    console.error(e);
  }
};

function templateHTML(formValues: any): string {
  return "";
}

export { sendEmail, sendSongListEmail };
