import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const dbPath = path.join(
  process.cwd(),
  'data',
  'db.json'
);

function questionId(question, group, index) {
  return (
    question.id ||
    `${group + 1}-${index + 1}`
  );
}

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Reading db.json...');

    const db = JSON.parse(
      fs.readFileSync(dbPath, 'utf8')
    );

    console.log(
      `Teams found: ${db.teams?.length || 0}`
    );

    console.log(
      `Question groups found: ${
        db.questionGroups?.length || 0
      }`
    );

    await client.query('BEGIN');

    // ------------------------------------------------
    // CLEAR EXISTING MIGRATED DATA
    // ------------------------------------------------

    console.log('Clearing existing database data...');

    await client.query(`
      TRUNCATE
        team_results,
        team_members,
        teams,
        questions
      RESTART IDENTITY CASCADE
    `);

    // ------------------------------------------------
    // MIGRATE QUESTIONS
    // ------------------------------------------------

    console.log('Migrating questions...');

    let questionCount = 0;

    for (
      let groupIndex = 0;
      groupIndex <
        (db.questionGroups || []).length;
      groupIndex++
    ) {
      const group =
        db.questionGroups[groupIndex] || [];

      for (
        let questionIndex = 0;
        questionIndex < group.length;
        questionIndex++
      ) {
        const q = group[questionIndex];

        await client.query(
          `
          INSERT INTO questions (
            id,
            question_group,
            question_index,
            type,
            question,
            code,
            answer,
            hint
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
          `,
          [
            questionId(
              q,
              groupIndex,
              questionIndex
            ),
            groupIndex + 1,
            questionIndex,
            q.type || 'debug',
            q.question || '',
            q.code || '',
            q.answer || '',
            q.hint || '',
          ]
        );

        questionCount++;
      }
    }

    console.log(
      `Questions migrated: ${questionCount}`
    );

    // ------------------------------------------------
    // MIGRATE TEAMS
    // ------------------------------------------------

    console.log('Migrating teams...');

    let teamCount = 0;
    let memberCount = 0;
    let resultCount = 0;

    for (const team of db.teams || []) {
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
          $4,
          $5,
          $6,
          $7,
          $8,
          $9
        )
        `,
        [
          team.id,
          team.code,
          team.teamName,
          Number.isInteger(
            team.playableMemberIndex
          )
            ? team.playableMemberIndex
            : 0,
          team.status || 'pending',
          team.category || 'grouped',
          team.questionGroup || 1,
          team.createdAt
            ? new Date(team.createdAt)
            : new Date(),
          team.startedAt || null,
        ]
      );

      teamCount++;

      // ----------------------------------------------
      // TEAM MEMBERS
      // ----------------------------------------------

      for (const member of team.members || []) {
        await client.query(
          `
          INSERT INTO team_members (
            team_id,
            name,
            phone,
            email
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          `,
          [
            team.id,
            member.name || '',
            member.phone || '',
            member.email || '',
          ]
        );

        memberCount++;
      }

      // ----------------------------------------------
      // TEAM RESULT
      // ----------------------------------------------

      if (team.result) {
        await client.query(
          `
          INSERT INTO team_results (
            team_id,
            completion_time,
            completed_at,
            player
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          `,
          [
            team.id,
            Number(team.result.time) || 0,
            team.result.completedAt
              ? new Date(
                  team.result.completedAt
                )
              : new Date(),
            team.result.player || '',
          ]
        );

        resultCount++;
      }
    }

    // ------------------------------------------------
    // SETTINGS
    // ------------------------------------------------

    if (db.settings) {
      await client.query(
        `
        INSERT INTO settings (
          id,
          sound
        )
        VALUES (1, $1)
        ON CONFLICT (id)
        DO UPDATE SET sound = EXCLUDED.sound
        `,
        [db.settings.sound !== false]
      );
    }

    await client.query('COMMIT');

    console.log('');
    console.log('======================================');
    console.log('DATABASE MIGRATION SUCCESSFUL');
    console.log('======================================');
    console.log(`Teams: ${teamCount}`);
    console.log(`Members: ${memberCount}`);
    console.log(`Questions: ${questionCount}`);
    console.log(`Results: ${resultCount}`);
    console.log('======================================');
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('');
    console.error(
      'DATABASE MIGRATION FAILED'
    );
    console.error(error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();