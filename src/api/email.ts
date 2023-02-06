import { Request, Response, Router } from "express";
import { sendSongListEmail } from "../email";
import _ from "lodash";

const router = Router();

router.post("/email", async (req: Request, res: Response) => {
  console.log("Hit email");
  console.log(req.body);
  const { emails, formQuestionsAndAnswers } = req.body;
  console.log(formQuestionsAndAnswers);
  console.log(_.uniq(["mrb@aliveinside.org", ...emails]));
  for (const email of _.uniq(["mrb@aliveinside.org", ...emails])) {
    console.log("sending email to ", email);
    console.log(JSON.stringify(formQuestionsAndAnswers));
    await sendSongListEmail(email, formQuestionsAndAnswers);
    console.log("email sent");
  }
  res.status(200);
});

export default router;
