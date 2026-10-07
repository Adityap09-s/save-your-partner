import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

const ADMIN_KEY = process.env.ADMIN_KEY || 'Aditya12';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ----------------------------------------------------
// DATABASE HELPERS
// ----------------------------------------------------

async function getTeam(teamId) {
  const teamResult = await pool.query(
    `
    SELECT
      t.id,
      t.code,
      t.team_name,
      t.playable_member_index,
      t.status,
      t.category,
      t.question_group,
      t.created_at,
      t.started_at,
      r.completion_time,
      r.completed_at,
      r.player
    FROM teams t
    LEFT JOIN LATERAL (
      SELECT
        completion_time,
        completed_at,
        player
      FROM team_results
      WHERE team_id = t.id
      ORDER BY id DESC
      LIMIT 1
    ) r ON TRUE
    WHERE t.id = $1
    `,
    [teamId]
  );

  if (teamResult.rows.length === 0) {
    return null;
  }

  const row = teamResult.rows[0];

  const membersResult = await pool.query(
    `
    SELECT name, phone, email
    FROM team_members
    WHERE team_id = $1
    ORDER BY id ASC
    `,
    [teamId]
  );

  return {
    id: row.id,
    code: row.code,
    teamName: row.team_name,
    members: membersResult.rows,
    playableMemberIndex: row.playable_member_index,
    status: row.status,
    createdAt: row.created_at,
    result:
      row.completion_time !== null
        ? {
            time: row.completion_time,
            completedAt: row.completed_at,
            player: row.player,
          }
        : null,
    category: row.category,
    questionGroup: row.question_group,
    startedAt: row.started_at,
  };
}

async function getAllTeams() {
  const teamsResult = await pool.query(`
    SELECT
      t.id,
      t.code,
      t.team_name,
      t.playable_member_index,
      t.status,
      t.category,
      t.question_group,
      t.created_at,
      t.started_at,
      r.completion_time,
      r.completed_at,
      r.player
    FROM teams t
    LEFT JOIN LATERAL (
      SELECT
        completion_time,
        completed_at,
        player
      FROM team_results
      WHERE team_id = t.id
      ORDER BY id DESC
      LIMIT 1
    ) r ON TRUE
    ORDER BY t.created_at ASC
  `);

  const teams = [];

  for (const row of teamsResult.rows) {
    const membersResult = await pool.query(
      `
      SELECT name, phone, email
      FROM team_members
      WHERE team_id = $1
      ORDER BY id ASC
      `,
      [row.id]
    );

    teams.push({
      id: row.id,
      code: row.code,
      teamName: row.team_name,
      members: membersResult.rows,
      playableMemberIndex: row.playable_member_index,
      status: row.status,
      createdAt: row.created_at,
      result:
        row.completion_time !== null
          ? {
              time: row.completion_time,
              completedAt: row.completed_at,
              player: row.player,
            }
          : null,
      category: row.category,
      questionGroup: row.question_group,
      startedAt: row.started_at,
    });
  }

  return teams;
}

function normalizeQuestion(row) {
  return {
    id: row.id,
    group: row.question_group - 1,
    index: row.question_index,
    type: row.type,
    question: row.question,
    code: row.code || '',
    answer: row.answer,
    hint: row.hint || '',
    ...(row.updated_at
      ? {
          updatedAt: row.updated_at,
        }
      : {}),
  };
}

async function getQuestions() {
  const result = await pool.query(`
    SELECT
      id,
      question_group,
      question_index,
      type,
      question,
      code,
      answer,
      hint,
      updated_at
    FROM questions
    ORDER BY question_group ASC, question_index ASC
  `);

  const groups = Array.from({ length: 6 }, () => []);

  for (const row of result.rows) {
    const groupIndex = row.question_group - 1;

    if (groupIndex >= 0 && groupIndex < 6) {
      groups[groupIndex].push(normalizeQuestion(row));
    }
  }

  return groups;
}

async function getQuestionsForGroup(groupNumber) {
  const result = await pool.query(
    `
    SELECT
      id,
      question_group,
      question_index,
      type,
      question,
      code,
      answer,
      hint,
      updated_at
    FROM questions
    WHERE question_group = $1
    ORDER BY question_index ASC
    `,
    [groupNumber]
  );

  return result.rows.map(normalizeQuestion);
}

// ----------------------------------------------------
// ADMIN AUTH
// ----------------------------------------------------

function admin(req, res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  next();
}

// ----------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');

    res.json({
      ok: true,
      app: 'save-your-partner-v7',
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check database error:', error);

    res.status(500).json({
      ok: false,
      app: 'save-your-partner-v7',
      database: 'disconnected',
    });
  }
});

// ----------------------------------------------------
// REGISTER TEAM
// ----------------------------------------------------

app.post('/api/teams/register', async (req, res) => {
  const { teamName, members } = req.body;

  if (
    !teamName ||
    !Array.isArray(members) ||
    members.length !== 2
  ) {
    return res.status(400).json({
      message: 'Team name and exactly two members are required.',
    });
  }

  if (
    members.some(
      (m) => !m?.name || !m?.phone || !m?.email
    )
  ) {
    return res.status(400).json({
      message: 'Both members need name, phone and email.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const teamId =
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7);

    const teamCode = `SYP-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const cleanTeamName = String(teamName).trim();

    await client.query(
      `
      INSERT INTO teams (
        id,
        code,
        team_name,
        playable_member_index,
        status,
        category,
        question_group,
        created_at,
        started_at
      )
      VALUES (
        $1,
        $2,
        $3,
        0,
        'pending',
        'grouped',
        1,
        NOW(),
        NULL
      )
      `,
      [teamId, teamCode, cleanTeamName]
    );

    for (const member of members) {
      await client.query(
        `
        INSERT INTO team_members (
          team_id,
          name,
          phone,
          email
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          teamId,
          String(member.name).trim(),
          String(member.phone).trim(),
          String(member.email).trim().toLowerCase(),
        ]
      );
    }

    await client.query('COMMIT');

    const team = await getTeam(teamId);

    res.json({
      team,
    });
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Team registration error:', error);

    res.status(500).json({
      message: 'Could not register team.',
    });
  } finally {
    client.release();
  }
});

// ----------------------------------------------------
// GET TEAM
// ----------------------------------------------------

app.get('/api/teams/:id', async (req, res) => {
  try {
    const team = await getTeam(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: 'Team not found',
      });
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);

    res.status(500).json({
      message: 'Could not load team.',
    });
  }
});

// ----------------------------------------------------
// GET TEAM RESULT
// ----------------------------------------------------

app.get('/api/teams/:id/result', async (req, res) => {
  try {
    const team = await getTeam(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: 'Team not found',
      });
    }

    res.json({
      time: team.result?.time ?? null,
      player: team.result?.player ?? null,
    });
  } catch (error) {
    console.error('Get result error:', error);

    res.status(500).json({
      message: 'Could not load result.',
    });
  }
});

// ----------------------------------------------------
// ADMIN - GET TEAMS
// ----------------------------------------------------

app.get('/api/admin/teams', admin, async (req, res) => {
  try {
    const teams = await getAllTeams();

    res.json(teams);
  } catch (error) {
    console.error('Admin teams error:', error);

    res.status(500).json({
      message: 'Could not load teams.',
    });
  }
});

// ----------------------------------------------------
// ADMIN - GET QUESTIONS
// ----------------------------------------------------

app.get('/api/admin/questions', admin, async (req, res) => {
  try {
    const groups = await getQuestions();

    res.json(groups);
  } catch (error) {
    console.error('Admin questions error:', error);

    res.status(500).json({
      message: 'Could not load questions.',
    });
  }
});

// ----------------------------------------------------
// ADMIN - EDIT QUESTION
// ----------------------------------------------------

app.put(
  '/api/admin/questions/:group/:index',
  admin,
  async (req, res) => {
    const g = Number(req.params.group);
    const i = Number(req.params.index);

    if (
      !Number.isInteger(g) ||
      g < 0 ||
      g > 5 ||
      !Number.isInteger(i) ||
      i < 0 ||
      i > 19
    ) {
      return res.status(400).json({
        message: 'Invalid group or question number.',
      });
    }

    try {
      const existingResult = await pool.query(
        `
        SELECT *
        FROM questions
        WHERE question_group = $1
        AND question_index = $2
        `,
        [g + 1, i]
      );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          message: 'Question not found',
        });
      }

      const existing = existingResult.rows[0];
      const incoming = req.body || {};

      const type =
        incoming.type === 'code'
          ? 'code'
          : 'debug';

      const question = String(
        incoming.question ?? ''
      ).trim();

      const answer = String(
        incoming.answer ?? ''
      ).trim();

      const code = String(
        incoming.code ?? existing.code ?? ''
      );

      const hint = String(
        incoming.hint ?? existing.hint ?? ''
      );

      if (!question || !answer) {
        return res.status(400).json({
          message:
            'Question and expected answer/fix are required.',
        });
      }

      const updated = await pool.query(
        `
        UPDATE questions
        SET
          type = $1,
          question = $2,
          code = $3,
          answer = $4,
          hint = $5,
          updated_at = NOW()
        WHERE question_group = $6
        AND question_index = $7
        RETURNING *
        `,
        [
          type,
          question,
          code,
          answer,
          hint,
          g + 1,
          i,
        ]
      );

      res.json(
        normalizeQuestion(updated.rows[0])
      );
    } catch (error) {
      console.error('Save question error:', error);

      res.status(500).json({
        message: 'Could not save question',
      });
    }
  }
);

// ----------------------------------------------------
// ADMIN - ADD QUESTION
// ----------------------------------------------------

app.post(
  '/api/admin/questions/:group',
  admin,
  async (req, res) => {
    const g = Number(req.params.group);

    if (!Number.isInteger(g) || g < 0 || g > 5) {
      return res.status(400).json({
        message: 'Invalid question group.',
      });
    }

    try {
      const countResult = await pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM questions
        WHERE question_group = $1
        `,
        [g + 1]
      );

      const count = countResult.rows[0].count;

      if (count >= 20) {
        return res.status(400).json({
          message:
            'Each group is limited to 20 questions.',
        });
      }

      const incoming = req.body || {};

      const type =
        incoming.type === 'code'
          ? 'code'
          : 'debug';

      const question = String(
        incoming.question ?? ''
      ).trim();

      const answer = String(
        incoming.answer ?? ''
      ).trim();

      const code = String(
        incoming.code ?? ''
      );

      const hint = String(
        incoming.hint ?? ''
      );

      if (!question || !answer) {
        return res.status(400).json({
          message:
            'Question and expected answer/fix are required.',
        });
      }

      const id =
        `${g + 1}-${count + 1}-${Date.now()}`;

      const inserted = await pool.query(
        `
        INSERT INTO questions (
          id,
          question_group,
          question_index,
          type,
          question,
          code,
          answer,
          hint,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          NOW()
        )
        RETURNING *
        `,
        [
          id,
          g + 1,
          count,
          type,
          question,
          code,
          answer,
          hint,
        ]
      );

      res.json(
        normalizeQuestion(inserted.rows[0])
      );
    } catch (error) {
      console.error('Add question error:', error);

      res.status(500).json({
        message: 'Could not add question',
      });
    }
  }
);

// ----------------------------------------------------
// ADMIN - APPROVE TEAM
// ----------------------------------------------------

app.post(
  '/api/admin/teams/:id/approve',
  admin,
  async (req, res) => {
    try {
      const idx = Number(
        req.body.playableMemberIndex
      );

      const selectedGroup = Number(
        req.body.questionGroup
      );

      const playableMemberIndex =
        Number.isInteger(idx) &&
        idx >= 0 &&
        idx < 2
          ? idx
          : 0;

      const questionGroup =
        Number.isInteger(selectedGroup) &&
        selectedGroup >= 1 &&
        selectedGroup <= 6
          ? selectedGroup
          : 1;

      const result = await pool.query(
        `
        UPDATE teams
        SET
          playable_member_index = $1,
          question_group = $2,
          status =
            CASE
              WHEN status = 'finished'
              THEN status
              ELSE 'approved'
            END
        WHERE id = $3
        RETURNING id
        `,
        [
          playableMemberIndex,
          questionGroup,
          req.params.id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Team not found',
        });
      }

      const team = await getTeam(req.params.id);

      res.json(team);
    } catch (error) {
      console.error('Approve team error:', error);

      res.status(500).json({
        message: 'Could not approve team',
      });
    }
  }
);

// ----------------------------------------------------
// ADMIN - FINISH TEAM
// ----------------------------------------------------

app.post(
  '/api/admin/teams/:id/finish',
  admin,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        UPDATE teams
        SET status = 'finished'
        WHERE id = $1
        RETURNING id
        `,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Team not found',
        });
      }

      const team = await getTeam(req.params.id);

      res.json(team);
    } catch (error) {
      console.error('Finish team error:', error);

      res.status(500).json({
        message: 'Could not finish team',
      });
    }
  }
);

// ----------------------------------------------------
// GAME - START
// ----------------------------------------------------

app.post(
  '/api/game/start/:id',
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const teamResult = await client.query(
        `
        SELECT *
        FROM teams
        WHERE id = $1
        FOR UPDATE
        `,
        [req.params.id]
      );

      if (teamResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          message: 'Team not found',
        });
      }

      const teamRow = teamResult.rows[0];

      if (teamRow.status !== 'approved') {
        await client.query('ROLLBACK');

        return res.status(403).json({
          message: 'Admin approval required.',
        });
      }

      const group = Number(
        teamRow.question_group || 1
      );

      const questionsResult = await client.query(
        `
        SELECT
          id,
          question_group,
          question_index,
          type,
          question,
          code,
          answer,
          hint,
          updated_at
        FROM questions
        WHERE question_group = $1
        ORDER BY question_index ASC
        LIMIT 20
        `,
        [group]
      );

      const questions = questionsResult.rows.map(
        normalizeQuestion
      );

      if (questions.length < 20) {
        await client.query('ROLLBACK');

        return res.status(500).json({
          message:
            'Selected question group must contain all 20 questions.',
        });
      }

      await client.query(
        `
        UPDATE teams
        SET
          started_at = $1,
          status = 'approved'
        WHERE id = $2
        `,
        [Date.now(), req.params.id]
      );

      await client.query(
        `
        DELETE FROM team_results
        WHERE team_id = $1
        `,
        [req.params.id]
      );

      await client.query('COMMIT');

      const team = await getTeam(req.params.id);

      const prisonerIndex =
        team.playableMemberIndex === 0
          ? 1
          : 0;

      const prisonerName =
        team.members[prisonerIndex]?.name ||
        'PRINCE';

      res.json({
        team,
        group,
        questions,
        prisonerName,
        prisonerMemberIndex: prisonerIndex,
      });
    } catch (error) {
      await client.query('ROLLBACK');

      console.error('Start game error:', error);

      res.status(500).json({
        message: 'Could not start game',
      });
    } finally {
      client.release();
    }
  }
);

// ----------------------------------------------------
// GAME - COMPLETE
// ----------------------------------------------------

app.post(
  '/api/game/complete/:id',
  async (req, res) => {
    try {
      const team = await getTeam(req.params.id);

      if (!team) {
        return res.status(404).json({
          message: 'Team not found',
        });
      }

      const time = Math.max(
        0,
        Number(req.body.time) || 0
      );

      const player =
        team.members[
          team.playableMemberIndex
        ]?.name ||
        team.members[0]?.name ||
        '';

      const completedAt =
        new Date().toISOString();

      await pool.query(
        `
        DELETE FROM team_results
        WHERE team_id = $1
        `,
        [req.params.id]
      );

      await pool.query(
        `
        INSERT INTO team_results (
          team_id,
          completion_time,
          completed_at,
          player
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          req.params.id,
          time,
          completedAt,
          player,
        ]
      );

      await pool.query(
        `
        UPDATE teams
        SET status = 'finished'
        WHERE id = $1
        `,
        [req.params.id]
      );

      const result = {
        time,
        completedAt,
        player,
      };

      res.json(result);
    } catch (error) {
      console.error('Complete game error:', error);

      res.status(500).json({
        message: 'Could not complete game',
      });
    }
  }
);

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------

const PORT = process.env.PORT || 4000;

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `Save Your Partner API running on port ${PORT}`
    );
    console.log(
      'Database: Supabase PostgreSQL'
    );
  }
);